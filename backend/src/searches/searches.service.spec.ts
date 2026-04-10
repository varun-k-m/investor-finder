import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SearchesService } from './searches.service';
import { AgentProgressStore } from './agent-progress.store';
import { Search } from './entities/search.entity';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { IdeaParserService } from '../agents/idea-parser.service';
import { UsersService } from '../users/users.service';

const mockUser = { id: 'user-1', clerk_id: 'clerk-1', plan: 'free', searches_used: 0 };
const mockSearch = { id: 'search-1', user_id: 'user-1', status: 'pending', raw_input: 'test' };
const mockCompleteSearch = { id: 'search-1', user_id: 'user-1', status: 'complete', raw_input: 'test' };
const mockParsedIdea = {
  title: 'Test', sector: ['fintech'], stage: 'mvp', geography: 'US',
  target_market: 'B2B', sub_sector: null, funding_ask: null, keywords: [], one_liner: null,
};

async function buildService(overrides: Partial<{
  searchRepo: object; investorRepo: object; store: AgentProgressStore;
  ideaParser: object; usersService: object; queue: object;
}> = {}) {
  const searchRepo = overrides.searchRepo ?? {
    findOne: jest.fn().mockResolvedValue(mockCompleteSearch),
    find: jest.fn().mockResolvedValue([mockCompleteSearch]),
    create: jest.fn().mockReturnValue(mockSearch),
    save: jest.fn().mockResolvedValue(mockSearch),
    update: jest.fn().mockResolvedValue({}),
  };
  const investorRepo = overrides.investorRepo ?? {
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const store = overrides.store ?? new AgentProgressStore();
  const ideaParser = overrides.ideaParser ?? { parse: jest.fn().mockResolvedValue(mockParsedIdea) };
  const usersService = overrides.usersService ?? {
    findByClerkId: jest.fn().mockResolvedValue(mockUser),
    incrementSearchesUsed: jest.fn().mockResolvedValue(undefined),
  };
  const queue = overrides.queue ?? { add: jest.fn().mockResolvedValue({}) };

  const module = await Test.createTestingModule({
    providers: [
      SearchesService,
      { provide: getRepositoryToken(Search), useValue: searchRepo },
      { provide: getRepositoryToken(InvestorProfile), useValue: investorRepo },
      { provide: AgentProgressStore, useValue: store },
      { provide: IdeaParserService, useValue: ideaParser },
      { provide: UsersService, useValue: usersService },
      { provide: getQueueToken('search'), useValue: queue },
    ],
  }).compile();

  return {
    service: module.get(SearchesService),
    searchRepo: searchRepo as any,
    investorRepo: investorRepo as any,
    ideaParser: ideaParser as any,
    usersService: usersService as any,
    queue: queue as any,
    store,
  };
}

// ─── S3-001: create ──────────────────────────────────────────────────────────

describe('SearchesService.create', () => {
  it('creates search, parses idea, enqueues job, returns id+status (AC: 1–5)', async () => {
    const { service, searchRepo, ideaParser, queue } = await buildService();
    const result = await service.create({ raw_input: 'A fintech startup idea for SMBs' }, 'clerk-1');

    expect(result).toEqual({ id: 'search-1', status: 'pending' });
    expect(searchRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ raw_input: 'A fintech startup idea for SMBs', status: 'pending' }),
    );
    expect(ideaParser.parse).toHaveBeenCalledWith('A fintech startup idea for SMBs');
    expect(searchRepo.update).toHaveBeenCalledWith(
      { id: 'search-1' },
      expect.objectContaining({ status: 'running' }),
    );
    expect(queue.add).toHaveBeenCalledWith({ searchId: 'search-1', parsedIdea: mockParsedIdea });
  });

  it('throws 401 when user not found (AC: 6)', async () => {
    const { service } = await buildService({
      usersService: { findByClerkId: jest.fn().mockResolvedValue(null) },
    });
    await expect(
      service.create({ raw_input: 'A fintech startup idea for SMBs' }, 'bad-clerk'),
    ).rejects.toThrow(UnauthorizedException);
  });
});

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('SearchesService.findAll', () => {
  it('returns all searches for user ordered newest first', async () => {
    const searches = [mockCompleteSearch, { ...mockCompleteSearch, id: 'search-2' }];
    const { service } = await buildService({
      searchRepo: {
        findOne: jest.fn().mockResolvedValue(mockCompleteSearch),
        create: jest.fn(), save: jest.fn(), update: jest.fn(),
        find: jest.fn().mockResolvedValue(searches),
      },
    });
    const result = await service.findAll('clerk-1');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'search-1' });
  });

  it('throws 401 when user not found', async () => {
    const { service } = await buildService({
      usersService: {
        findByClerkId: jest.fn().mockResolvedValue(null),
        incrementSearchesUsed: jest.fn(),
      },
    });
    await expect(service.findAll('bad-clerk')).rejects.toThrow(UnauthorizedException);
  });
});

// ─── S3-002: findOne ─────────────────────────────────────────────────────────

describe('SearchesService.findOne', () => {
  it('returns search for correct owner (AC: 1–2)', async () => {
    const { service } = await buildService();
    const result = await service.findOne('search-1', 'clerk-1');
    expect(result).toMatchObject({ id: 'search-1', user_id: 'user-1' });
  });

  it('throws 404 when search not found (AC: 3)', async () => {
    const { service } = await buildService({
      searchRepo: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(), save: jest.fn(), update: jest.fn(),
      },
    });
    await expect(service.findOne('bad-id', 'clerk-1')).rejects.toThrow(NotFoundException);
  });

  it('throws 403 when search belongs to another user (AC: 4)', async () => {
    const { service } = await buildService({
      usersService: { findByClerkId: jest.fn().mockResolvedValue({ ...mockUser, id: 'user-2' }) },
    });
    await expect(service.findOne('search-1', 'clerk-2')).rejects.toThrow(ForbiddenException);
  });
});

// ─── S3-003: findInvestors ───────────────────────────────────────────────────

describe('SearchesService.findInvestors', () => {
  it('returns paginated investors ordered by rank_position (AC: 1–3)', async () => {
    const mockInvestors = [{ id: 'inv-1', rank_position: 1 }];
    const { service, investorRepo } = await buildService({
      investorRepo: { findAndCount: jest.fn().mockResolvedValue([mockInvestors, 1]) },
    });

    const result = await service.findInvestors('search-1', 'clerk-1', { page: 1, limit: 20 });
    expect(result).toEqual({ data: mockInvestors, total: 1, page: 1, limit: 20 });
    expect(investorRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { search_id: 'search-1' },
        order: { rank_position: 'ASC' },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('returns empty list when no investors yet (AC: 1)', async () => {
    const { service } = await buildService();
    const result = await service.findInvestors('search-1', 'clerk-1', { page: 1, limit: 20 });
    expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
  });
});

// ─── SSE streaming ───────────────────────────────────────────────────────────

describe('SearchesService.getProgressStream', () => {
  it('emits complete immediately for already-complete search', (done) => {
    buildService().then(({ service }) => {
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

  it('emits events from store for in-progress search', (done) => {
    buildService({
      searchRepo: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(), save: jest.fn(), update: jest.fn(),
      },
    }).then(({ service, store }) => {
      const stream = service.getProgressStream('search-2');
      const events: unknown[] = [];
      stream.subscribe({
        next: (e) => events.push(e),
        complete: () => {
          expect(events.length).toBeGreaterThan(0);
          done();
        },
      });
      setTimeout(() => {
        store.emit('search-2', 'searching', 20);
        store.complete('search-2');
      }, 0);
    });
  });
});
