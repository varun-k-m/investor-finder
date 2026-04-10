# Story S5-004: Sentry Error Monitoring — Function Stubs (DSN deferred)

## User Story
As a developer, I want Sentry initialised and wired so that adding the SENTRY_DSN environment variable immediately activates error monitoring with no further code changes.

## Acceptance Criteria

1. Backend: Sentry initialised in `main.ts` using `@sentry/nestjs`, gated on `SENTRY_DSN` env var — if missing, Sentry is completely skipped (no crash, no warning spam)
2. Backend: When `SENTRY_DSN` is set, `SentryModule.forRoot()` is in `AppModule` and a global `SentryInterceptor` captures unhandled 5xx errors
3. Backend: HTTP 4xx exceptions are NOT captured (filter in `beforeSend`)
4. Frontend: `@sentry/nextjs` installed; `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` created — all gated on `NEXT_PUBLIC_SENTRY_DSN`
5. Frontend: `next.config.mjs` wrapped with `withSentryConfig` (silent mode, no auth token required)
6. App starts cleanly with no DSN set — zero console errors related to Sentry
7. `npm run typecheck && npm run lint` pass in frontend with 0 errors
8. Full backend test suite passes with 0 failures

## Technical Context

**Architecture refs:** §3 (Sentry), §13 Gate 4

**Env vars (deferred — add later):**
- Backend Railway: `SENTRY_DSN`
- Frontend Vercel: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (optional)

**Backend — install:**
```bash
cd backend && npm install @sentry/nestjs
```

**Backend — `main.ts` (before `NestFactory.create`):**
```typescript
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_package_version,
    beforeSend(event) {
      const status = event.extra?.['http.response.status_code'] as number | undefined;
      if (status && status < 500) return null;
      return event;
    },
  });
}
```

**Backend — `AppModule`:**
```typescript
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    // ... existing imports ...
    SentryModule.forRoot(),
  ],
})
export class AppModule {}
```

**Backend — global interceptor in `main.ts`:**
```typescript
import { SentryInterceptor } from '@sentry/nestjs';
// after app creation:
app.useGlobalInterceptors(new SentryInterceptor());
```

Note: Verify the exact import path for `SentryInterceptor` from `@sentry/nestjs` — check the installed package's exports. If `SentryInterceptor` is not exported, use the `SentryGlobalFilter` alternative or check the SDK's NestJS quickstart docs.

**Frontend — install:**
```bash
cd frontend && npm install @sentry/nextjs
```

**`frontend/sentry.client.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**`frontend/sentry.server.config.ts`:** Same as client config.

**`frontend/sentry.edge.config.ts`:** Same as client config.

**`frontend/next.config.mjs` — wrap with `withSentryConfig`:**
```javascript
import { withSentryConfig } from '@sentry/nextjs';

// ... existing nextConfig object ...

export default withSentryConfig(nextConfig, {
  silent: true,           // suppress build output
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
```

## Tasks

- [x] Install `@sentry/nestjs` in backend
- [x] Add Sentry init in `backend/src/main.ts` (before NestFactory), gated on `SENTRY_DSN`
- [x] Add `SentryModule.forRoot()` to `AppModule.imports` — N/A: v10 uses `setupExpressErrorHandler` instead; wired in `main.ts` after app creation
- [x] Add global error handler after app creation in `main.ts` via `setupExpressErrorHandler`
- [x] Install `@sentry/nextjs` in frontend
- [x] Create `frontend/sentry.client.config.ts`, `frontend/sentry.server.config.ts`, `frontend/sentry.edge.config.ts`
- [x] Wrap `frontend/next.config.mjs` with `withSentryConfig`
- [x] Verify app boots cleanly without `SENTRY_DSN` set
- [x] Run `npm run typecheck && npm run lint` in frontend — 0 errors
- [x] Run full backend test suite — 0 failures

## File List
- `backend/src/main.ts` (modified — Sentry init + global interceptor)
- `backend/src/app.module.ts` (modified — SentryModule.forRoot)
- `frontend/sentry.client.config.ts` (new)
- `frontend/sentry.server.config.ts` (new)
- `frontend/sentry.edge.config.ts` (new)
- `frontend/next.config.mjs` (modified — withSentryConfig)

## Dev Agent Record

### Completion Notes
- `@sentry/nestjs` v10 + `@sentry/nextjs` installed (hoisted to monorepo root node_modules)
- Backend `main.ts`: `Sentry.init()` via dynamic require gated on `SENTRY_DSN`; `setupExpressErrorHandler` wired after app creation (v10 pattern — no `SentryModule.forRoot()` needed)
- `beforeSend` filters out HTTP 4xx events
- Frontend: `sentry.{client,server,edge}.config.ts` all gated on `NEXT_PUBLIC_SENTRY_DSN`; `withSentryConfig` wraps `next.config.mjs` with source map upload disabled unless `SENTRY_AUTH_TOKEN` is set
- App boots cleanly with no DSN set ✅
- 105/105 backend tests ✅ | frontend typecheck + lint ✅

### Change Log
- S5-004 (2026-04-10): Sentry monitoring stubs — init code wired in both FE and BE, gated on env vars
