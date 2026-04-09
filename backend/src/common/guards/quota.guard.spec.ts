import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionContext, HttpException, UnauthorizedException } from '@nestjs/common';
import { QuotaGuard } from './quota.guard';
import { UsersService } from '../../users/users.service';
import { Search } from '../../searches/entities/search.entity';

function mockContext(user: object | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

async function buildGuard(overrides: Partial<{ usersService: object; searchRepo: object }> = {}) {
  const module = await Test.createTestingModule({
    providers: [
      QuotaGuard,
      { provide: UsersService, useValue: overrides.usersService ?? { findByClerkId: jest.fn() } },
      { provide: getRepositoryToken(Search), useValue: overrides.searchRepo ?? { count: jest.fn().mockResolvedValue(0) } },
    ],
  }).compile();
  return module.get(QuotaGuard);
}

describe('QuotaGuard', () => {
  it('allows free user under monthly limit (AC: 2)', async () => {
    const guard = await buildGuard({
      usersService: { findByClerkId: jest.fn().mockResolvedValue({ id: 'user-1', plan: 'free' }) },
      searchRepo: { count: jest.fn().mockResolvedValue(2) },
    });
    const result = await guard.canActivate(mockContext({ sub: 'clerk-1' }));
    expect(result).toBe(true);
  });

  it('blocks free user at limit with 429 (AC: 2)', async () => {
    const guard = await buildGuard({
      usersService: { findByClerkId: jest.fn().mockResolvedValue({ id: 'user-1', plan: 'free' }) },
      searchRepo: { count: jest.fn().mockResolvedValue(3) },
    });
    await expect(guard.canActivate(mockContext({ sub: 'clerk-1' }))).rejects.toThrow(HttpException);
  });

  it('allows pro user unconditionally (AC: 3)', async () => {
    const searchRepo = { count: jest.fn() };
    const guard = await buildGuard({
      usersService: { findByClerkId: jest.fn().mockResolvedValue({ id: 'user-2', plan: 'pro' }) },
      searchRepo,
    });
    const result = await guard.canActivate(mockContext({ sub: 'clerk-2' }));
    expect(result).toBe(true);
    expect(searchRepo.count).not.toHaveBeenCalled();
  });

  it('throws 401 when no user on request (AC: 4)', async () => {
    const guard = await buildGuard();
    await expect(guard.canActivate(mockContext(undefined))).rejects.toThrow(UnauthorizedException);
  });
});
