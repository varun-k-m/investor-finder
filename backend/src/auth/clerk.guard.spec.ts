import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ClerkGuard } from './clerk.guard';

// Mock @clerk/backend — verifyToken is a standalone export
const mockVerifyToken = jest.fn();
jest.mock('@clerk/backend', () => ({
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
}));

function buildContext(authHeader?: string, isPublicMeta = false): ExecutionContext {
  const request = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('ClerkGuard', () => {
  let guard: ClerkGuard;
  let reflector: Reflector;
  let configService: ConfigService;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as any;
    configService = { get: jest.fn().mockReturnValue('test-secret') } as any;
    guard = new ClerkGuard(reflector, configService);
    mockVerifyToken.mockReset();
  });

  it('allows @Public() routes without a token (AC: 2)', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const ctx = buildContext(undefined, true);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('throws 401 when Authorization header is missing (AC: 10)', async () => {
    const ctx = buildContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when Authorization header is not Bearer (AC: 10)', async () => {
    const ctx = buildContext('Basic sometoken');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when verifyToken rejects (expired/invalid token) (AC: 10)', async () => {
    mockVerifyToken.mockRejectedValue(new Error('Token expired'));
    const ctx = buildContext('Bearer bad.token.here');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true and attaches payload to req.user on valid token (AC: 1)', async () => {
    const payload = { sub: 'user_123', email: 'user@test.com' };
    mockVerifyToken.mockResolvedValue(payload);
    const request: any = { headers: { authorization: 'Bearer valid.token' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });
});
