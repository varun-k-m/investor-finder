import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscoveryService } from './discovery.service';
import { CrunchbaseService } from './sources/crunchbase.service';
import { WebSearchService } from './sources/web-search.service';
import { NewsSignalService } from './sources/news-signal.service';
import { SynthesisService } from './synthesis.service';
import { RankingService } from './ranking.service';
import { AgentProgressStore } from '../searches/agent-progress.store';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { Search } from '../searches/entities/search.entity';
import { ParsedIdea, RankedInvestor, SynthesisedInvestor } from '../common/types';

const parsedIdea: ParsedIdea = {
  title: 'Test',
  sector: ['fintech'],
  sub_sector: null,
  stage: 'mvp',
  geography: 'US',
  target_market: 'B2B',
  funding_ask: null,
  keywords: [],
  one_liner: null,
};

const mockInvestor: SynthesisedInvestor = {
  canonical_name: 'Sequoia',
  fund_name: null,
  website: 'https://seq.com',
  sectors: [],
  stages: [],
  geo_focus: [],
  check_min: null,
  check_max: null,
  contact_email: null,
  linkedin_url: null,
  sources: ['crunchbase'],
  source_urls: [],
  conflicts: [],
};

const mockRanked: RankedInvestor = {
  ...mockInvestor,
  sector_fit: 80,
  stage_fit: 70,
  budget_fit: 60,
  geo_fit: 90,
  overall: 76,
  fit_reasoning: 'Good fit',
  rank_position: 1,
};

async function buildService(overrides: Partial<{
  crunchbase: object; webSearch: object; newsSignal: object;
  synthesis: object; ranking: object; investorRepo: object; searchRepo: object;
}> = {}) {
  const module = await Test.createTestingModule({
    providers: [
      DiscoveryService,
      { provide: CrunchbaseService, useValue: overrides.crunchbase ?? { search: jest.fn().mockResolvedValue([mockInvestor]) } },
      { provide: WebSearchService, useValue: overrides.webSearch ?? { search: jest.fn().mockResolvedValue([]) } },
      { provide: NewsSignalService, useValue: overrides.newsSignal ?? { search: jest.fn().mockResolvedValue([]) } },
      { provide: SynthesisService, useValue: overrides.synthesis ?? { synthesise: jest.fn().mockResolvedValue([mockInvestor]) } },
      { provide: RankingService, useValue: overrides.ranking ?? { rank: jest.fn().mockResolvedValue([mockRanked]) } },
      { provide: getRepositoryToken(InvestorProfile), useValue: overrides.investorRepo ?? { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue([]) } },
      { provide: getRepositoryToken(Search), useValue: overrides.searchRepo ?? { update: jest.fn().mockResolvedValue({}) } },
      { provide: AgentProgressStore, useValue: { emit: jest.fn(), complete: jest.fn(), getOrCreate: jest.fn() } },
    ],
  }).compile();
  return module.get(DiscoveryService);
}

describe('DiscoveryService', () => {
  it('runs full pipeline: source → synthesise → rank → save → complete (AC: 1–6)', async () => {
    const searchRepo = { update: jest.fn().mockResolvedValue({}) };
    const investorRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue([]) };
    const synthesis = { synthesise: jest.fn().mockResolvedValue([mockInvestor]) };
    const ranking = { rank: jest.fn().mockResolvedValue([mockRanked]) };

    const service = await buildService({ searchRepo, investorRepo, synthesis, ranking });
    await service.run('search-1', parsedIdea);

    expect(synthesis.synthesise).toHaveBeenCalled();
    expect(ranking.rank).toHaveBeenCalled();
    expect(investorRepo.save).toHaveBeenCalled();
    expect(searchRepo.update).toHaveBeenCalledWith(
      { id: 'search-1' },
      expect.objectContaining({ status: 'complete', result_count: 1 }),
    );
  });

  it('continues pipeline when one source fails (AC: 2)', async () => {
    const crunchbase = { search: jest.fn().mockRejectedValue(new Error('API down')) };
    const searchRepo = { update: jest.fn().mockResolvedValue({}) };
    const investorRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue([]) };

    const service = await buildService({ crunchbase, searchRepo, investorRepo });
    await service.run('search-2', parsedIdea);

    // Should still complete, not fail
    expect(searchRepo.update).toHaveBeenCalledWith(
      { id: 'search-2' },
      expect.objectContaining({ status: 'complete' }),
    );
  });

  it('marks search as failed on unrecoverable error (AC: 7)', async () => {
    const synthesis = { synthesise: jest.fn().mockRejectedValue(new Error('Claude down')) };
    const searchRepo = { update: jest.fn().mockResolvedValue({}) };

    const service = await buildService({ synthesis, searchRepo });
    await service.run('search-3', parsedIdea);

    expect(searchRepo.update).toHaveBeenCalledWith(
      { id: 'search-3' },
      { status: 'failed' },
    );
  });
});
