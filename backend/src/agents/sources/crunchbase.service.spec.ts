import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CrunchbaseService } from './crunchbase.service';
import { ParsedIdea } from '../../common/types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const parsedIdea: ParsedIdea = {
  title: 'Fintech App',
  sector: ['fintech'],
  sub_sector: 'payments',
  stage: 'mvp',
  geography: 'US',
  target_market: 'B2B',
  funding_ask: { amount: 500000, currency_mentioned: 'USD' },
  keywords: ['payments', 'b2b', 'saas'],
  one_liner: 'B2B payment tool',
};

async function buildService(apiKey: string | undefined) {
  const module = await Test.createTestingModule({
    providers: [
      CrunchbaseService,
      {
        provide: ConfigService,
        useValue: { get: jest.fn().mockReturnValue(apiKey) },
      },
    ],
  }).compile();
  return module.get(CrunchbaseService);
}

describe('CrunchbaseService', () => {
  afterEach(() => jest.clearAllMocks());

  it('maps API response to SynthesisedInvestor[] (AC: 1, 5)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockResolvedValue({
      data: {
        entities: [
          {
            properties: {
              name: 'Sequoia Capital',
              website_url: 'https://sequoiacap.com',
              investor_stage: ['seed', 'series_a'],
              identifier: { permalink: 'sequoia-capital' },
            },
          },
        ],
      },
    });

    const results = await service.search(parsedIdea);
    expect(results).toHaveLength(1);
    expect(results[0].canonical_name).toBe('Sequoia Capital');
    expect(results[0].sources).toEqual(['crunchbase']);
    expect(results[0].source_urls[0]).toContain('sequoia-capital');
  });

  it('returns [] when CRUNCHBASE_API_KEY is not set (AC: 7)', async () => {
    const service = await buildService(undefined);
    const results = await service.search(parsedIdea);
    expect(results).toEqual([]);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns [] on API error (AC: 6)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockRejectedValue(new Error('Network error'));
    const results = await service.search(parsedIdea);
    expect(results).toEqual([]);
  });
});
