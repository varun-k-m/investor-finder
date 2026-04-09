import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';
import { UserThrottlerGuard } from './throttler.guard';

function buildContext(user?: { sub?: string }, isPublic = false): ExecutionContext {
  const request = { ip: '127.0.0.1', user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeGuard(isPublic: boolean): UserThrottlerGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
  const storage = {} as unknown as ThrottlerStorage;
  const options = [{ ttl: 60000, limit: 30 }];
  return new UserThrottlerGuard(options as any, storage, reflector);
}

describe('UserThrottlerGuard', () => {
  describe('getTracker', () => {
    it('returns clerk sub when user is authenticated (AC: 6)', async () => {
      const guard = makeGuard(false);
      const tracker = await (guard as any).getTracker({ ip: '1.2.3.4', user: { sub: 'user_abc' } });
      expect(tracker).toBe('user_abc');
    });

    it('falls back to IP when user has no sub (AC: 6)', async () => {
      const guard = makeGuard(false);
      const tracker = await (guard as any).getTracker({ ip: '1.2.3.4', user: {} });
      expect(tracker).toBe('1.2.3.4');
    });

    it('falls back to IP when user is undefined (AC: 6)', async () => {
      const guard = makeGuard(false);
      const tracker = await (guard as any).getTracker({ ip: '1.2.3.4' });
      expect(tracker).toBe('1.2.3.4');
    });
  });

  describe('shouldSkip', () => {
    it('skips throttling for @Public() routes (AC: 6)', async () => {
      const guard = makeGuard(true);
      const ctx = buildContext(undefined, true);
      const result = await (guard as any).shouldSkip(ctx);
      expect(result).toBe(true);
    });

    it('does not skip for protected routes (AC: 6)', async () => {
      const guard = makeGuard(false);
      const ctx = buildContext({ sub: 'user_xyz' }, false);
      const result = await (guard as any).shouldSkip(ctx);
      expect(result).toBe(false);
    });
  });
});
