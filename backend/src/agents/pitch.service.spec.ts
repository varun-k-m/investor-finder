import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { PitchService } from './pitch.service';
import { Search } from '../searches/entities/search.entity';

const mockInvestor = {
  id: 'inv-1',
  canonical_name: 'Sequoia',
  sectors: ['fintech'],
  stages: ['seed'],
  fit_reasoning: 'Strong fit',
} as any;

const mockSearch = {
  id: 'search-1',
  user_id: 'user-1',
  status: 'complete',
  parsed_idea: { title: 'Test', sector: ['fintech'] },
  completed_at: new Date(),
};

async function buildService(overrides: Partial<{ searchRepo: object; anthropic: object }> = {}) {
  const searchRepo = overrides.searchRepo ?? { findOne: jest.fn().mockResolvedValue(mockSearch) };
  const anthropic = overrides.anthropic ?? {
    messages: {
      create: jest.fn().mockResolvedValue({ content: [{ text: 'Dear Sequoia, ...' }] }),
    },
  };

  const module = await Test.createTestingModule({
    providers: [
      PitchService,
      { provide: getRepositoryToken(Search), useValue: searchRepo },
      { provide: 'ANTHROPIC_CLIENT', useValue: anthropic },
    ],
  }).compile();

  return { service: module.get(PitchService), searchRepo: searchRepo as any, anthropic: anthropic as any };
}

describe('PitchService.generate', () => {
  it('calls Claude and returns pitch text (AC: 6)', async () => {
    const { service, anthropic } = await buildService();
    const result = await service.generate(mockInvestor, 'user-1');
    expect(result).toBe('Dear Sequoia, ...');
    expect(anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6', max_tokens: 600 }),
    );
  });

  it('throws BadRequestException when no completed search found (AC: 7)', async () => {
    const { service } = await buildService({
      searchRepo: { findOne: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.generate(mockInvestor, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when search has no parsed_idea (AC: 7)', async () => {
    const { service } = await buildService({
      searchRepo: { findOne: jest.fn().mockResolvedValue({ ...mockSearch, parsed_idea: null }) },
    });
    await expect(service.generate(mockInvestor, 'user-1')).rejects.toThrow(BadRequestException);
  });
});
