import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { Search } from './entities/search.entity';
import { AgentProgressStore } from './agent-progress.store';
import { IdeaParserService } from '../agents/idea-parser.service';
import { UsersService } from '../users/users.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { InvestorQueryDto } from './dto/investor-query.dto';

export interface SseMessageEvent {
  data: string;
  type?: string;
}

/** [Source: docs/architecture.md#Section 5.2, 5.3, 7.4] */
@Injectable()
export class SearchesService {
  constructor(
    @InjectRepository(Search)
    private readonly searchRepo: Repository<Search>,
    @InjectRepository(InvestorProfile)
    private readonly investorRepo: Repository<InvestorProfile>,
    private readonly progressStore: AgentProgressStore,
    private readonly ideaParser: IdeaParserService,
    private readonly usersService: UsersService,
    @InjectQueue('search') private readonly searchQueue: Queue,
  ) {}

  /** AC: 1–5 [Source: docs/architecture.md#Section 5.2, 6.1] */
  async create(dto: CreateSearchDto, clerkSub: string): Promise<{ id: string; status: string }> {
    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    const search = await this.searchRepo.save(
      this.searchRepo.create({
        user_id: user.id,
        raw_input: dto.raw_input,
        status: 'pending',
        sectors: dto.sectors ?? null,
        stages: dto.stages ?? null,
        geo_focus: dto.geo_focus ?? null,
        budget_min: dto.budget_min ?? null,
        budget_max: dto.budget_max ?? null,
      }),
    );

    const parsedIdea = await this.ideaParser.parse(dto.raw_input, {
      sectors: dto.sectors,
      stages: dto.stages,
      geo_focus: dto.geo_focus,
      budget_min: dto.budget_min,
      budget_max: dto.budget_max,
    });
    await this.searchRepo.update(
      { id: search.id },
      { parsed_idea: parsedIdea as unknown as Record<string, unknown>, status: 'running' },
    );

    await this.searchQueue.add({ searchId: search.id, parsedIdea });

    // Increment usage counter atomically (AC: S3-007 5)
    await this.usersService.incrementSearchesUsed(user.id);

    return { id: search.id, status: 'pending' };
  }

  /** [Source: docs/architecture.md#Section 5.2 — GET /searches list] */
  async findAll(clerkSub: string): Promise<Search[]> {
    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();
    return this.searchRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
  }

  /** AC: S3-002 — 1–4 [Source: docs/architecture.md#Section 5.2] */
  async findOne(id: string, clerkSub: string): Promise<Search> {
    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    const search = await this.searchRepo.findOne({ where: { id } });
    if (!search) throw new NotFoundException('Search not found');
    if (search.user_id !== user.id) throw new ForbiddenException();

    return search;
  }

  /** AC: S3-003 — 1–6 [Source: docs/architecture.md#Section 5.3] */
  async findInvestors(
    searchId: string,
    clerkSub: string,
    query: InvestorQueryDto,
  ): Promise<{ data: InvestorProfile[]; total: number; page: number; limit: number }> {
    await this.findOne(searchId, clerkSub);

    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.investorRepo.findAndCount({
      where: { search_id: searchId },
      order: { rank_position: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  getProgressStream(searchId: string): Observable<SseMessageEvent> {
    return new Observable((subscriber) => {
      // Hold references so the synchronous teardown can clean up even if the
      // async DB lookup hasn't resolved yet (fixes pre-existing cleanup bug).
      let rxSub: { unsubscribe(): void } | undefined;
      let keepalive: ReturnType<typeof setInterval> | undefined;
      let dbPoll: ReturnType<typeof setInterval> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      this.searchRepo
        .findOne({ where: { id: searchId } })
        .then((search) => {
          if (subscriber.closed) return;

          if (search && (search.status === 'complete' || search.status === 'failed')) {
            subscriber.next({
              data: JSON.stringify({
                type: 'complete',
                stage: search.status,
                progress: 100,
                result_count: search.result_count ?? 0,
              }),
              type: 'complete',
            });
            subscriber.complete();
            return;
          }

          const subject = this.progressStore.getOrCreate(searchId);
          rxSub = subject.subscribe({
            next: (event) => subscriber.next({ data: JSON.stringify(event), type: event.type }),
            complete: () => subscriber.complete(),
            error: (e) => subscriber.error(e),
          });

          keepalive = setInterval(
            () => subscriber.next({ data: '', type: 'keepalive' }),
            15_000,
          );

          // Fallback DB poll — fires progress + complete events even when the job
          // runs on a different backend instance (in-memory store is not shared).
          // DiscoveryService writes progress_stage/pct/message to DB on every emit.
          let lastEmittedPct = -1;
          dbPoll = setInterval(async () => {
            if (subscriber.closed) return;
            try {
              const s = await this.searchRepo.findOne({ where: { id: searchId } });
              if (!s) return;

              // Emit intermediate progress if it has advanced since last poll
              if (
                s.status === 'running' &&
                s.progress_stage &&
                s.progress_pct !== null &&
                s.progress_pct !== undefined &&
                s.progress_pct > lastEmittedPct
              ) {
                lastEmittedPct = s.progress_pct;
                subscriber.next({
                  data: JSON.stringify({
                    type: 'agent_update',
                    stage: s.progress_stage,
                    progress: s.progress_pct,
                    message: s.progress_message ?? undefined,
                  }),
                  type: 'agent_update',
                });
              }

              if (s.status === 'complete' || s.status === 'failed') {
                subscriber.next({
                  data: JSON.stringify({
                    type: 'complete',
                    stage: s.status,
                    progress: 100,
                    result_count: s.result_count ?? 0,
                  }),
                  type: 'complete',
                });
                subscriber.complete();
              }
            } catch {
              // ignore transient DB errors — next poll will retry
            }
          }, 3_000);

          // 5-minute safety timeout (searches can take up to ~3 min)
          timeout = setTimeout(() => subscriber.complete(), 300_000);
        })
        .catch((err) => subscriber.error(err));

      // Teardown — runs synchronously when the client disconnects or the
      // observable completes, regardless of whether the DB lookup finished.
      return () => {
        rxSub?.unsubscribe();
        if (keepalive !== undefined) clearInterval(keepalive);
        if (dbPoll !== undefined) clearInterval(dbPoll);
        if (timeout !== undefined) clearTimeout(timeout);
      };
    });
  }
}
