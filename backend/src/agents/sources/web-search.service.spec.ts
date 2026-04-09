import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebSearchService } from './web-search.service';
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
  funding_ask: null,
  keywords: ['payments', 'b2b', 'saas'],
  one_liner: 'B2B payment tool',
};

async function buildService(apiKey: string | undefined) {
  const module = await Test.createTestingModule({
    providers: [
      WebSearchService,
      { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(apiKey) } },
    ],
  }).compile();
  return module.get(WebSearchService);
}

describe('WebSearchService', () => {
  afterEach(() => jest.clearAllMocks());

  it('maps Tavily results to SynthesisedInvestor[] (AC: 1, 4)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockResolvedValue({
      data: {
        results: [
          { title: 'Sequoia Capital | VC Firm', url: 'https://sequoiacap.com', content: '...' },
        ],
      },
    });

    const results = await service.search(parsedIdea);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].canonical_name).toBe('Sequoia Capital');
    expect(results[0].sources).toEqual(['web']);
  });

  it('deduplicates by domain (AC: 4)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockResolvedValue({
      data: {
        results: [
          { title: 'A16Z', url: 'https://a16z.com', content: '' },
          { title: 'Andreessen Horowitz', url: 'https://www.a16z.com/about', content: '' },
        ],
      },
    });

    const results = await service.search(parsedIdea);
    expect(results).toHaveLength(1);
  });

  it('returns [] when TAVILY_API_KEY is not set (AC: 5)', async () => {
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
