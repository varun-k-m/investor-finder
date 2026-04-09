import { Test } from '@nestjs/testing';
import { RankingService } from './ranking.service';
import { ParsedIdea, SynthesisedInvestor } from '../common/types';

const parsedIdea: ParsedIdea = {
  title: 'Test',
  sector: ['fintech'],
  sub_sector: null,
  stage: 'mvp',
  geography: 'US',
  target_market: 'B2B',
  funding_ask: { amount: 500000, currency_mentioned: 'USD' },
  keywords: [],
  one_liner: null,
};

const makeInvestor = (name: string): SynthesisedInvestor => ({
  canonical_name: name,
  fund_name: null,
  website: null,
  sectors: [],
  stages: [],
  geo_focus: [],
  check_min: null,
  check_max: null,
  contact_email: null,
  linkedin_url: null,
  sources: [],
  source_urls: [],
  conflicts: [],
});

function buildAnthropicMock(text: string) {
  return {
    messages: { create: jest.fn().mockResolvedValue({ content: [{ type: 'text', text }] }) },
  };
}

async function buildService(mockClient: object) {
  const module = await Test.createTestingModule({
    providers: [
      RankingService,
      { provide: 'ANTHROPIC_CLIENT', useValue: mockClient },
    ],
  }).compile();
  return module.get(RankingService);
}

describe('RankingService', () => {
  it('returns [] without calling Claude when investors is empty (AC: 2)', async () => {
    const mockClient = buildAnthropicMock('[]');
    const service = await buildService(mockClient);
    const result = await service.rank([], parsedIdea);
    expect(result).toEqual([]);
    expect(mockClient.messages.create).not.toHaveBeenCalled();
  });

  it('sorts by overall descending and assigns rank_position (AC: 7)', async () => {
    const scores = [
      { canonical_name: 'Investor A', sector_fit: 50, stage_fit: 50, budget_fit: 50, geo_fit: 50, overall: 50, fit_reasoning: 'ok' },
      { canonical_name: 'Investor B', sector_fit: 90, stage_fit: 90, budget_fit: 90, geo_fit: 90, overall: 90, fit_reasoning: 'great' },
    ];
    const mockClient = buildAnthropicMock(JSON.stringify(scores));
    const service = await buildService(mockClient);
    const result = await service.rank([makeInvestor('Investor A'), makeInvestor('Investor B')], parsedIdea);
    expect(result[0].canonical_name).toBe('Investor B');
    expect(result[0].rank_position).toBe(1);
    expect(result[1].rank_position).toBe(2);
  });

  it('returns fallback with overall=0 on JSON parse failure (AC: 6)', async () => {
    const mockClient = buildAnthropicMock('not valid json {{');
    const service = await buildService(mockClient);
    const result = await service.rank([makeInvestor('Investor A')], parsedIdea);
    expect(result[0].overall).toBe(0);
    expect(result[0].fit_reasoning).toBe('Scoring unavailable');
    expect(result[0].rank_position).toBe(1);
  });
});
