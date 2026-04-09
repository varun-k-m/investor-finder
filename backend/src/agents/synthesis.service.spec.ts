import { Test } from '@nestjs/testing';
import { SynthesisService } from './synthesis.service';
import { ParsedIdea, SynthesisedInvestor } from '../common/types';

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

const rawInvestor: SynthesisedInvestor = {
  canonical_name: 'Sequoia Capital',
  fund_name: null,
  website: 'https://sequoiacap.com',
  sectors: ['fintech'],
  stages: ['seed'],
  geo_focus: ['US'],
  check_min: null,
  check_max: null,
  contact_email: null,
  linkedin_url: null,
  sources: ['crunchbase'],
  source_urls: [],
  conflicts: [],
};

function buildAnthropicMock(text: string) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text }],
      }),
    },
  };
}

async function buildService(mockClient: object) {
  const module = await Test.createTestingModule({
    providers: [
      SynthesisService,
      { provide: 'ANTHROPIC_CLIENT', useValue: mockClient },
    ],
  }).compile();
  return module.get(SynthesisService);
}

describe('SynthesisService', () => {
  it('returns [] without calling Claude when rawRecords is empty (AC: 2)', async () => {
    const mockClient = buildAnthropicMock('[]');
    const service = await buildService(mockClient);
    const result = await service.synthesise([], parsedIdea);
    expect(result).toEqual([]);
    expect(mockClient.messages.create).not.toHaveBeenCalled();
  });

  it('returns parsed synthesised array on success (AC: 1, 3)', async () => {
    const synthesised = [{ ...rawInvestor, canonical_name: 'Sequoia Capital Merged' }];
    const mockClient = buildAnthropicMock(JSON.stringify(synthesised));
    const service = await buildService(mockClient);
    const result = await service.synthesise([rawInvestor], parsedIdea);
    expect(result[0].canonical_name).toBe('Sequoia Capital Merged');
  });

  it('slices result to max 30 (AC: 6)', async () => {
    const bigArray = Array.from({ length: 50 }, (_, i) => ({
      ...rawInvestor,
      canonical_name: `Investor ${i}`,
    }));
    const mockClient = buildAnthropicMock(JSON.stringify(bigArray));
    const service = await buildService(mockClient);
    const result = await service.synthesise([rawInvestor], parsedIdea);
    expect(result).toHaveLength(30);
  });

  it('returns raw records on JSON parse failure (AC: 5)', async () => {
    const mockClient = buildAnthropicMock('not valid json {{');
    const service = await buildService(mockClient);
    const result = await service.synthesise([rawInvestor], parsedIdea);
    expect(result).toEqual([rawInvestor]);
  });
});
