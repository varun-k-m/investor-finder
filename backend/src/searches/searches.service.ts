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
      this.searchRepo.create({ user_id: user.id, raw_input: dto.raw_input, status: 'pending' }),
    );

    const parsedIdea = await this.ideaParser.parse(dto.raw_input);
    await this.searchRepo.update(
      { id: search.id },
      { parsed_idea: parsedIdea as unknown as Record<string, unknown>, status: 'running' },
    );

    await this.searchQueue.add({ searchId: search.id, parsedIdea });

    // Increment usage counter atomically (AC: S3-007 5)
    await this.usersService.incrementSearchesUsed(user.id);

    return { id: search.id, status: 'pending' };
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
      this.searchRepo
        .findOne({ where: { id: searchId } })
        .then((search) => {
          if (search && (search.status === 'complete' || search.status === 'failed')) {
            subscriber.next({
              data: JSON.stringify({ type: 'complete', stage: search.status, progress: 100 }),
              type: 'complete',
            });
            subscriber.complete();
            return;
          }

          const subject = this.progressStore.getOrCreate(searchId);
          const sub = subject.subscribe({
            next: (event) => subscriber.next({ data: JSON.stringify(event), type: event.type }),
            complete: () => subscriber.complete(),
            error: (e) => subscriber.error(e),
          });

          const keepalive = setInterval(
            () => subscriber.next({ data: '', type: 'keepalive' }),
            15_000,
          );

          const timeout = setTimeout(() => subscriber.complete(), 60_000);

          return () => {
            sub.unsubscribe();
            clearInterval(keepalive);
            clearTimeout(timeout);
          };
        })
        .catch((err) => subscriber.error(err));
    });
  }
}
