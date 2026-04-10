/**
 * TestClerkGuard — replaces ClerkGuard in integration tests.
 * Reads x-test-clerk-id header and sets req.user = { sub: value }.
 * Allows integration tests to run without a real Clerk JWT.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TestClerkGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clerkId = request.headers['x-test-clerk-id'];
    if (clerkId) {
      request.user = { sub: clerkId };
      return true;
    }
    return false;
  }
}
