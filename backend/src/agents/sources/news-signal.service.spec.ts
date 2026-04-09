import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NewsSignalService } from './news-signal.service';
import { ParsedIdea } from '../../common/types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const parsedIdea: ParsedIdea = {
  title: 'Test',
  sector: ['fintech'],
  sub_sector: 'payments',
  stage: 'mvp',
  geography: 'US',
  target_market: 'B2B',
  funding_ask: null,
  keywords: [],
  one_liner: null,
};

async function buildService(apiKey: string | undefined) {
  const module = await Test.createTestingModule({
    providers: [
      NewsSignalService,
      { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(apiKey) } },
    ],
  }).compile();
  return module.get(NewsSignalService);
}

describe('NewsSignalService', () => {
  afterEach(() => jest.clearAllMocks());

  it('maps news results with sources=["news"] (AC: 1, 4)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockResolvedValue({
      data: { results: [{ title: 'Sequoia leads fintech round', url: 'https://news.example.com/1', content: '...' }] },
    });
    const results = await service.search(parsedIdea);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].sources).toEqual(['news']);
  });

  it('returns [] when TAVILY_API_KEY not set (AC: 5)', async () => {
    const service = await buildService(undefined);
    const results = await service.search(parsedIdea);
    expect(results).toEqual([]);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns [] on API error (AC: 6)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockRejectedValue(new Error('timeout'));
    const results = await service.search(parsedIdea);
    expect(results).toEqual([]);
  });

  it('deduplicates by URL (AC: 1)', async () => {
    const service = await buildService('test-key');
    mockedAxios.post.mockResolvedValue({
      data: {
        results: [
          { title: 'Article A', url: 'https://news.example.com/1', content: '' },
          { title: 'Article A again', url: 'https://news.example.com/1', content: '' },
        ],
      },
    });
    const results = await service.search(parsedIdea);
    expect(results).toHaveLength(1);
  });
});
