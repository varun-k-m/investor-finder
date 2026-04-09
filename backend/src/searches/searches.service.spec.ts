import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchesService } from './searches.service';
import { AgentProgressStore } from './agent-progress.store';
import { Search } from './entities/search.entity';

async function buildService(searchStatus: string | null) {
  const searchRepo = {
    findOne: jest.fn().mockResolvedValue(
      searchStatus ? { status: searchStatus } : null,
    ),
  };
  const store = new AgentProgressStore();

  const module = await Test.createTestingModule({
    providers: [
      SearchesService,
      { provide: getRepositoryToken(Search), useValue: searchRepo },
      { provide: AgentProgressStore, useValue: store },
    ],
  }).compile();

  return { service: module.get(SearchesService), store };
}

describe('SearchesService.getProgressStream', () => {
  it('emits complete immediately for already-complete search (AC: 8)', (done) => {
    buildService('complete').then(({ service }) => {
      const stream = service.getProgressStream('search-1');
      const events: unknown[] = [];
      stream.subscribe({
        next: (e) => events.push(e),
        complete: () => {
          expect((events[0] as any).type).toBe('complete');
          done();
        },
      });
    });
  });

  it('emits events from store for in-progress search (AC: 2, 5)', (done) => {
    buildService(null).then(({ service, store }) => {
      const stream = service.getProgressStream('search-2');
      const events: unknown[] = [];
      stream.subscribe({
        next: (e) => events.push(e),
        complete: () => {
          expect(events.length).toBeGreaterThan(0);
          done();
        },
      });
      // Wait one tick for findOne promise to resolve and subject to be created
      setTimeout(() => {
        store.emit('search-2', 'searching', 20);
        store.complete('search-2');
      }, 0);
    });
  });
});
