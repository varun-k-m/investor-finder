import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InvestorsService } from './investors.service';
import { InvestorProfile } from './entities/investor-profile.entity';
import { SavedInvestor } from './entities/saved-investor.entity';
import { PitchDraft } from './entities/pitch-draft.entity';
import { UsersService } from '../users/users.service';
import { PitchService } from '../agents/pitch.service';

const mockUser = { id: 'user-1', clerk_id: 'clerk-1' };
const mockInvestor = { id: 'inv-1', canonical_name: 'Sequoia', sectors: ['fintech'], stages: ['seed'], fit_reasoning: 'Great fit' };
const mockSaved = { id: 'saved-1', user_id: 'user-1', investor_id: 'inv-1', status: 'saved' };
const mockDraft = { id: 'draft-1', user_id: 'user-1', investor_id: 'inv-1', content: 'Dear Sequoia...', version: 1 };

async function buildService(overrides: Partial<{
  investorRepo: object; savedRepo: object; pitchDraftRepo: object;
  usersService: object; pitchService: object;
}> = {}) {
  const module = await Test.createTestingModule({
    providers: [
      InvestorsService,
      { provide: getRepositoryToken(InvestorProfile), useValue: overrides.investorRepo ?? { findOne: jest.fn().mockResolvedValue(mockInvestor) } },
      { provide: getRepositoryToken(SavedInvestor), useValue: overrides.savedRepo ?? { findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockReturnValue(mockSaved), save: jest.fn().mockResolvedValue(mockSaved) } },
      { provide: getRepositoryToken(PitchDraft), useValue: overrides.pitchDraftRepo ?? { findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockReturnValue(mockDraft), save: jest.fn().mockResolvedValue(mockDraft) } },
      { provide: UsersService, useValue: overrides.usersService ?? { findByClerkId: jest.fn().mockResolvedValue(mockUser) } },
      { provide: PitchService, useValue: overrides.pitchService ?? { generate: jest.fn().mockResolvedValue('Dear Sequoia...') } },
    ],
  }).compile();
  return module.get(InvestorsService);
}

// ─── S3-004: saveInvestor ────────────────────────────────────────────────────

describe('InvestorsService.saveInvestor', () => {
  it('creates and returns SavedInvestor on first save (AC: 1–2)', async () => {
    const service = await buildService();
    const result = await service.saveInvestor('inv-1', 'clerk-1');
    expect(result).toMatchObject({ user_id: 'user-1', investor_id: 'inv-1', status: 'saved' });
  });

  it('returns existing record without duplicate on second save (AC: 3)', async () => {
    const service = await buildService({
      savedRepo: { findOne: jest.fn().mockResolvedValue(mockSaved), create: jest.fn(), save: jest.fn() },
    });
    const result = await service.saveInvestor('inv-1', 'clerk-1');
    expect(result).toEqual(mockSaved);
  });

  it('throws 404 when investor not found (AC: 4)', async () => {
    const service = await buildService({
      investorRepo: { findOne: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.saveInvestor('bad-id', 'clerk-1')).rejects.toThrow(NotFoundException);
  });

  it('throws 401 when user not found (AC: 5)', async () => {
    const service = await buildService({
      usersService: { findByClerkId: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.saveInvestor('inv-1', 'bad-clerk')).rejects.toThrow(UnauthorizedException);
  });
});

// ─── S3-005: updateStatus ────────────────────────────────────────────────────

describe('InvestorsService.updateStatus', () => {
  it('updates status and returns saved record (AC: 1–3)', async () => {
    const saved = { ...mockSaved, status: 'saved' as const };
    const savedRepo = {
      findOne: jest.fn().mockResolvedValue(saved),
      save: jest.fn().mockImplementation((s: any) => Promise.resolve(s)),
    };
    const service = await buildService({ savedRepo });
    const result = await service.updateStatus('inv-1', 'clerk-1', 'contacted');
    expect(result.status).toBe('contacted');
  });

  it('throws 404 when investor not in saved list (AC: 4)', async () => {
    const service = await buildService({
      savedRepo: { findOne: jest.fn().mockResolvedValue(null), create: jest.fn(), save: jest.fn() },
    });
    await expect(service.updateStatus('inv-1', 'clerk-1', 'contacted')).rejects.toThrow(NotFoundException);
  });
});

// ─── S3-006: generatePitch ───────────────────────────────────────────────────

describe('InvestorsService.generatePitch', () => {
  it('generates pitch draft with version 1 for first draft (AC: 1–3)', async () => {
    const service = await buildService();
    const result = await service.generatePitch('inv-1', 'clerk-1');
    expect(result).toMatchObject({ user_id: 'user-1', investor_id: 'inv-1', version: 1 });
  });

  it('increments version for subsequent drafts (AC: 3)', async () => {
    const existingDraft = { ...mockDraft, version: 2 };
    const pitchDraftRepo = {
      findOne: jest.fn().mockResolvedValue(existingDraft),
      create: jest.fn().mockImplementation((d: any) => d),
      save: jest.fn().mockImplementation((d: any) => Promise.resolve(d)),
    };
    const service = await buildService({ pitchDraftRepo });
    const result = await service.generatePitch('inv-1', 'clerk-1');
    expect(result.version).toBe(3);
  });

  it('throws 404 when investor not found (AC: 4)', async () => {
    const service = await buildService({
      investorRepo: { findOne: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.generatePitch('bad-id', 'clerk-1')).rejects.toThrow(NotFoundException);
  });
});
