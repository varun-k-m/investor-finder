import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * Custom ThrottlerGuard that tracks rate limits per authenticated user_id (clerk sub)
 * rather than IP address, per Section 12 of the architecture.
 * Falls back to IP when request is unauthenticated (e.g. @Public() routes).
 * [Source: docs/architecture.md#Section 12]
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req['user'] as { sub?: string } | undefined;
    if (user?.sub) {
      return user.sub;
    }
    return (req['ip'] as string) ?? 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const reflector = this.reflector;
    const isPublic = reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic === true;
  }
}
