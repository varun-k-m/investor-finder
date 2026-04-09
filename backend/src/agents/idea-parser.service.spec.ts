import { Test } from '@nestjs/testing';
import { IdeaParserService } from './idea-parser.service';
import { ParsedIdea } from '../common/types';

const mockParsedIdea: ParsedIdea = {
  title: 'B2B Payment Tool',
  sector: ['fintech'],
  sub_sector: 'B2B payment reconciliation',
  stage: 'mvp',
  geography: 'US',
  target_market: 'B2B',
  funding_ask: { amount: 500000, currency_mentioned: 'USD' },
  keywords: ['payments', 'reconciliation', 'b2b'],
  one_liner: 'Automates B2B payment reconciliation.',
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
      IdeaParserService,
      { provide: 'ANTHROPIC_CLIENT', useValue: mockClient },
    ],
  }).compile();
  return module.get(IdeaParserService);
}

describe('IdeaParserService', () => {
  it('parses valid JSON response (AC: 3, 4)', async () => {
    const mockClient = buildAnthropicMock(JSON.stringify(mockParsedIdea));
    const service = await buildService(mockClient);
    const result = await service.parse('We build B2B payment tools');
    expect(result.title).toBe('B2B Payment Tool');
    expect(result.sector).toEqual(['fintech']);
    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
      }),
    );
  });

  it('strips markdown fences before parsing (AC: 5)', async () => {
    const wrapped = '```json\n' + JSON.stringify(mockParsedIdea) + '\n```';
    const mockClient = buildAnthropicMock(wrapped);
    const service = await buildService(mockClient);
    const result = await service.parse('some idea');
    expect(result.title).toBe('B2B Payment Tool');
  });

  it('throws on invalid JSON from Claude (AC: 5)', async () => {
    const mockClient = buildAnthropicMock('not valid json {{');
    const service = await buildService(mockClient);
    await expect(service.parse('some idea')).rejects.toThrow(
      'IdeaParser: invalid JSON from Claude',
    );
  });

  it('propagates Claude API errors (AC: 7)', async () => {
    const mockClient = {
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API error')),
      },
    };
    const service = await buildService(mockClient);
    await expect(service.parse('some idea')).rejects.toThrow('API error');
  });
});
