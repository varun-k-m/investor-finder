import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { Search } from './entities/search.entity';
import { AgentProgressStore } from './agent-progress.store';

export interface SseMessageEvent {
  data: string;
  type?: string;
}

/** [Source: docs/architecture.md#Section 5.3, 7.4] */
@Injectable()
export class SearchesService {
  constructor(
    @InjectRepository(Search)
    private readonly searchRepo: Repository<Search>,
    private readonly progressStore: AgentProgressStore,
  ) {}

  getProgressStream(searchId: string): Observable<SseMessageEvent> {
    return new Observable((subscriber) => {
      // Check if already complete
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

          // Keepalive every 15s
          const keepalive = setInterval(
            () => subscriber.next({ data: '', type: 'keepalive' }),
            15_000,
          );

          // Auto-close after 60s
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
