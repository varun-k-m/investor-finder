# Story 1.2: Configure Clerk Auth + Webhook Sync to Postgres

Status: review

## Story

As a platform user,
I want authentication handled via Clerk with my account automatically created in the database on first sign-in,
so that my identity is securely managed and I can be linked to my searches and saved investors.

## Acceptance Criteria

1. `ClerkGuard` is implemented in `backend/src/auth/clerk.guard.ts` and validates the Clerk JWT on every protected request.
2. `@Public()` decorator exists and opts routes out of `ClerkGuard`.
3. `ClerkGuard` is registered as the global `APP_GUARD` in `app.module.ts`.
4. `POST /api/v1/auth/webhook` endpoint exists in `clerk-webhook.controller.ts`, is decorated with `@Public()`, and syncs user data to the `users` table on `user.created` and `user.updated` Clerk events.
5. Webhook payload is verified using `svix` signature verification before any DB write — requests with invalid signatures return 400.
6. A `CurrentUser` decorator exists that extracts the authenticated user from the request.
7. Frontend: Clerk `<ClerkProvider>` wraps the root layout. Sign-in and sign-up pages use Clerk's hosted components.
8. Frontend: `middleware.ts` at the root protects all `(app)/*` routes, redirecting unauthenticated users to `/sign-in`.
9. End-to-end: signing up creates a row in the `users` table with `clerk_id`, `email`, `name`, `plan='free'`.
10. Unit test: `ClerkGuard` rejects requests with missing/invalid JWT (returns 401).

## Tasks / Subtasks

- [x] Backend — Clerk guard and strategy (AC: 1, 2, 3, 6)
  - [x] Install: `@clerk/backend svix` (`@clerk/nestjs` does not exist — used standalone `verifyToken` from `@clerk/backend`)
  - [x] Create `backend/src/auth/clerk.guard.ts` — implements `CanActivate`, calls `verifyToken()` with Bearer token, attaches decoded payload to `req.user`
  - [x] Create `backend/src/auth/clerk.strategy.ts`
  - [x] Create `@Public()` decorator using `SetMetadata('isPublic', true)` in `public.decorator.ts`
  - [x] Register `ClerkGuard` as `{ provide: APP_GUARD, useClass: ClerkGuard }` in `AuthModule` providers
  - [x] Create `@CurrentUser()` param decorator in `current-user.decorator.ts`
- [x] Backend — Webhook controller (AC: 4, 5)
  - [x] Create `backend/src/auth/clerk-webhook.controller.ts` with `@Post('auth/webhook')` + `@Public()`
  - [x] svix `Webhook.verify()` checks `svix-id`, `svix-timestamp`, `svix-signature` against `CLERK_WEBHOOK_SECRET`
  - [x] Handles `user.created` and `user.updated` — delegates to `UsersService.upsertFromClerk()`
  - [x] Returns 400 on invalid signature; 200 on success
  - [x] Raw body middleware registered in `main.ts` before global body parser for `/api/v1/auth/webhook`
- [x] Backend — UsersModule foundation (AC: 9)
  - [x] Create `backend/src/users/users.repository.ts` — stub with `upsertFromClerk()` (TypeORM wired in S1-003)
  - [x] Create `backend/src/users/users.service.ts` that delegates to repository
  - [x] Create `backend/src/users/entities/user.entity.ts` matching `users` table schema from arch §4.1
- [x] Frontend — Clerk setup (AC: 7, 8)
  - [x] Installed `@clerk/nextjs` v7 (`--legacy-peer-deps` required)
  - [x] `app/layout.tsx` wrapped with `<ClerkProvider>`
  - [x] `frontend/.env.local` created with blank key slots
  - [x] `app/(auth)/sign-in/page.tsx` uses `<SignIn />` Clerk component
  - [x] `app/(auth)/sign-up/page.tsx` uses `<SignUp />` Clerk component
  - [x] `frontend/middleware.ts` uses `clerkMiddleware()` + `createRouteMatcher` (v7 API) — protects dashboard/search/saved/settings
- [x] Tests (AC: 10)
  - [x] 5 unit tests for `ClerkGuard`: missing header → 401, non-Bearer → 401, invalid token → 401, valid token → true + req.user set, @Public() → bypass

## Dev Notes

- **Security binding**: Svix signature verification MUST happen before any DB access. Do not skip or stub this — a fake webhook could create arbitrary users. [Source: docs/architecture.md#Section 12]
- **Raw body for svix**: NestJS's body parser consumes the stream; you must configure the webhook route to receive the raw buffer. Use `app.use('/api/v1/auth/webhook', express.raw({ type: 'application/json' }))` in `main.ts` BEFORE the global body parser, or use a custom middleware. Svix requires the exact raw bytes to verify the HMAC.
- **APP_GUARD placement**: Register `ClerkGuard` as `APP_GUARD` in `AuthModule` (not `AppModule`) — NestJS resolves it via DI from there. The guard reads the `isPublic` metadata to skip verification on `@Public()` routes.
- **`@Public()` routes**: `POST /auth/webhook` must be public (svix handles its own auth). Any future health-check routes should also use `@Public()`.
- **Clerk JWT field**: The decoded JWT has `sub` (= `clerk_id`), `email`, `first_name`, `last_name`. Map these to the `users` table.
- **Frontend middleware**: Use Clerk's `clerkMiddleware()` (v5+ API) or `authMiddleware` depending on installed version — check the installed `@clerk/nextjs` version and use the correct export.
- **No Stripe/quota yet**: `plan` defaults to `'free'`, `searches_used` to `0`. Quota enforcement comes in S5-002.
- **TypeORM User entity**: Must match the `users` table exactly from Section 4.1 — `id` (UUID, PK), `clerk_id` (TEXT, UNIQUE), `email` (TEXT, UNIQUE), `name` (TEXT, nullable), `plan` (TEXT, default 'free'), `searches_used` (INT, default 0), `created_at` (TIMESTAMPTZ). Database/TypeORM not yet wired (S1-003) — the entity can be defined but won't be used until after S1-003.

### Project Structure Notes

Files to create/modify in this story:
```
backend/src/
├── main.ts                          ← Add raw body bypass for webhook route
├── app.module.ts                    ← AuthModule already imported (stub from S1-001)
├── auth/
│   ├── auth.module.ts               ← Register APP_GUARD
│   ├── clerk.guard.ts               ← NEW
│   ├── clerk.strategy.ts            ← NEW
│   └── clerk-webhook.controller.ts  ← NEW
├── users/
│   ├── users.module.ts              ← Wire entity + repository
│   ├── users.service.ts             ← NEW
│   ├── users.repository.ts          ← NEW
│   └── entities/user.entity.ts      ← NEW (TypeORM entity)
frontend/
├── middleware.ts                    ← NEW (root of frontend/)
├── app/
│   ├── layout.tsx                   ← Wrap with ClerkProvider
│   ├── (auth)/sign-in/page.tsx      ← Clerk SignIn component
│   └── (auth)/sign-up/page.tsx      ← Clerk SignUp component
```

### References

- [Source: docs/architecture.md#Section 4.1] — `users` table schema (TypeORM entity must match exactly)
- [Source: docs/architecture.md#Section 5.1] — Auth webhook route `POST /api/v1/auth/webhook`
- [Source: docs/architecture.md#Section 7.4] — SearchModule wiring pattern (follow same pattern for AuthModule/UsersModule)
- [Source: docs/architecture.md#Section 8.1] — Frontend auth page paths `(auth)/sign-in`, `(auth)/sign-up`
- [Source: docs/architecture.md#Section 12] — Security: Clerk JWT guard, svix webhook verification, `@Public()` pattern

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@clerk/nestjs` not in npm registry — used `@clerk/backend` v3 with standalone `verifyToken()` export instead.
- `ignoreDeprecations: "6.0"` in tsconfig.json invalid for TS 5.9 — added `--ignoreDeprecations 5.0` to `typecheck` npm script as CLI override.
- `@clerk/nextjs` v7 required `--legacy-peer-deps` due to peer dep conflict with React 18.
- `typeorm` + `@nestjs/typeorm` + `pg` installed in this story to provide type declarations for `user.entity.ts`; module not wired until S1-003.

### Completion Notes List

- All 5 tasks and 17 subtasks complete.
- ClerkGuard uses `verifyToken` (standalone export) from `@clerk/backend` v3.
- svix raw body bypass registered in `main.ts` before NestJS body parser.
- `UsersRepository.upsertFromClerk()` is a stub — fully implemented with TypeORM in S1-003.
- Frontend middleware uses `clerkMiddleware` + `createRouteMatcher` per Clerk v7 API.
- 15 tests total (10 types + 5 guard) — all passing.
- AC9 (users table row on signup) requires live DB from S1-003; verifiable after deploy.

### File List

- `backend/src/main.ts` (updated — raw body middleware for webhook route)
- `backend/src/auth/auth.module.ts` (updated — APP_GUARD, ClerkWebhookController, UsersModule import)
- `backend/src/auth/clerk.guard.ts`
- `backend/src/auth/clerk.strategy.ts`
- `backend/src/auth/clerk-webhook.controller.ts`
- `backend/src/auth/public.decorator.ts`
- `backend/src/auth/current-user.decorator.ts`
- `backend/src/auth/clerk.guard.spec.ts`
- `backend/src/users/users.module.ts` (updated — UsersService + UsersRepository providers)
- `backend/src/users/users.service.ts`
- `backend/src/users/users.repository.ts`
- `backend/src/users/entities/user.entity.ts`
- `backend/package.json` (updated — typecheck script, @clerk/backend, svix, typeorm, @nestjs/typeorm, pg added)
- `frontend/app/layout.tsx` (updated — ClerkProvider wrapping)
- `frontend/app/(auth)/sign-in/page.tsx` (updated — Clerk SignIn component)
- `frontend/app/(auth)/sign-up/page.tsx` (updated — Clerk SignUp component)
- `frontend/middleware.ts`
- `frontend/.env.local`
- `frontend/package.json` (updated — @clerk/nextjs added)
