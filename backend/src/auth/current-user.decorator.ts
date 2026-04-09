import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated Clerk JWT payload from the request.
 * Use after ClerkGuard has run — payload is attached to req.user.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
