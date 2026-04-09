# Story 1.6: Deploy Skeleton to Vercel + Railway

Status: ready-for-dev (code complete — manual deploy steps pending)

## Story

As a developer,
I want the skeleton Next.js frontend deployed to Vercel and the skeleton NestJS backend deployed to Railway,
so that we have live deployment targets that the CI/CD pipeline (S1-005) can deploy to on every merge to main.

## Acceptance Criteria

1. Frontend is deployed and accessible at a Vercel-assigned URL (e.g., `investor-finder.vercel.app`).
2. Backend is deployed and accessible at a Railway-assigned URL (e.g., `investor-finder-backend.up.railway.app`).
3. `GET <railway-url>/api/v1` returns HTTP 200 (or a recognisable NestJS 404 — confirming the app is running and the global prefix is active).
4. `GET <vercel-url>` returns HTTP 200 with the Next.js skeleton homepage.
5. All required environment variables are set in Vercel and Railway dashboards — no secrets in source code.
6. Backend `DATABASE_URL` (Supabase) and `REDIS_URL` (Upstash) are configured in Railway — the app connects without startup errors.
7. Backend `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` are set in Railway.
8. Frontend `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` are set in Vercel.
9. GitHub Actions deploy workflow (from S1-005) successfully deploys both apps on the first post-merge push to `main`.
10. Railway deploy logs show no unhandled exceptions on startup.

## Tasks / Subtasks

- [ ] Backend — Railway setup (AC: 2, 3, 5, 6, 7, 10)
  - [ ] Create Railway project and service named `backend`
  - [ ] Connect Railway service to the GitHub repo, set root directory to `backend/`
  - [ ] Configure build command: `npm run build` (`nest build`)
  - [ ] Configure start command: `node dist/main`
  - [ ] Set Railway environment variables (from Section 9):
    - `NODE_ENV=production`
    - `DATABASE_URL` — Supabase direct connection URL (port 5432 for Railway; not PgBouncer for migration runs)
    - `REDIS_URL` — Upstash TLS URL
    - `CLERK_SECRET_KEY`
    - `CLERK_WEBHOOK_SECRET`
    - `NEXT_PUBLIC_APP_URL` — Vercel URL (set after FE deployed)
    - `ANTHROPIC_API_KEY` — set to a placeholder for now (agents come in Sprint 2)
  - [ ] Trigger first manual deploy from Railway dashboard
  - [ ] Verify startup logs: no TypeORM connection errors, no BullMQ errors, NestJS bootstrap message visible
  - [ ] Run `npm run migration:run` against production Supabase (one-time manual — document in `docs/deployment.md`)
  - [ ] Test: `curl https://<railway-url>/api/v1` → verify app is live
- [ ] Frontend — Vercel setup (AC: 1, 4, 5, 8)
  - [ ] Create Vercel project, import GitHub repo, set root directory to `frontend/`
  - [ ] Framework preset: Next.js (Vercel auto-detects)
  - [ ] Set Vercel environment variables:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - `NEXT_PUBLIC_APP_URL=https://<vercel-url>` (use Vercel's assigned domain)
    - `NEXT_PUBLIC_POSTHOG_KEY` — placeholder for now (S5-005)
  - [ ] Trigger first deploy
  - [ ] Verify homepage loads at Vercel URL
- [ ] Clerk webhook registration (AC: 7)
  - [ ] In Clerk dashboard, add webhook endpoint: `https://<railway-url>/api/v1/auth/webhook`
  - [ ] Select events: `user.created`, `user.updated`
  - [ ] Copy the signing secret to `CLERK_WEBHOOK_SECRET` in Railway env vars
- [ ] CI/CD integration (AC: 9)
  - [ ] Add GitHub secrets: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, `RAILWAY_TOKEN`
  - [ ] Push a trivial commit to `main` and verify the deploy workflow runs end-to-end successfully
  - [ ] Confirm both Vercel and Railway dashboards show the deploy triggered by GitHub Actions
- [ ] Smoke test (AC: 3, 4, 10)
  - [ ] `curl https://<railway-url>/api/v1/users/me` → should return 401 (ClerkGuard active, no token)
  - [ ] Navigate to `https://<vercel-url>/sign-in` → Clerk sign-in page renders
  - [ ] Sign up for a new account → verify row appears in Supabase `users` table

## Dev Notes

- **Production DATABASE_URL**: Railway should use the Supabase **direct connection** (port 5432), not the PgBouncer pooler. The pooler (port 6543) is fine for app reads/writes but can cause issues with TypeORM's connection management in some NestJS versions.
- **`synchronize: false` in production**: Double-check that TypeORM config reads from `ConfigService` and `synchronize` is always `false`. In production, tables only exist if migrations were run manually — verify this before going live.
- **Running migrations against production**: This is a one-time manual step for the initial schema. After S1-003, document the procedure in `docs/deployment.md`: `npm run migration:run` pointing at the production `DATABASE_URL`. Future stories' migrations will be run the same way.
- **Railway port**: Railway injects `PORT` environment variable dynamically. NestJS must listen on `process.env.PORT || 3001`. Update `main.ts`: `await app.listen(process.env.PORT ?? 3001)`.
- **Vercel and CORS**: The Vercel URL must be set as `NEXT_PUBLIC_APP_URL` in Railway's env and passed to NestJS CORS config. If the Vercel URL includes `https://`, ensure the CORS origin string matches exactly (no trailing slash).
- **Clerk webhook URL**: Must be the Railway production URL. Clerk will POST to this on user events. Verify the webhook is working by checking Supabase `users` table after test sign-up.
- **`ANTHROPIC_API_KEY` placeholder**: Set it to a dummy value in Railway (`sk-ant-placeholder`) — the agents module doesn't start yet. This prevents startup errors from missing env vars if `ConfigService.get()` is used at bootstrap time.
- **This story is mostly manual**: Most tasks involve dashboard configuration. Document every step in `docs/deployment.md` so it's reproducible. The CI/CD automation from S1-005 handles future deploys.
- **Custom domain**: Optional for Sprint 1 — use Vercel/Railway assigned domains. Document custom domain setup in `docs/deployment.md` for later.

### Project Structure Notes

No new code files in this story. Changes are:
```
backend/src/main.ts          ← Update listen() to use process.env.PORT
docs/deployment.md           ← Update with production URLs, migration procedure, secrets checklist
```

### References

- [Source: docs/architecture.md#Section 3] — Deployment: Vercel (FE) + Railway (BE)
- [Source: docs/architecture.md#Section 5.1] — Clerk webhook route `POST /api/v1/auth/webhook`
- [Source: docs/architecture.md#Section 7.2] — `main.ts` listen call (update port to use `process.env.PORT`)
- [Source: docs/architecture.md#Section 9] — All environment variable names and values
- [Source: docs/architecture.md#Section 12] — Security: Clerk webhook signature verification (ensure active in prod)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `main.ts` already uses `process.env.PORT ?? 3001` from S1-001 — no change needed.
- `docs/deployment.md` created in S1-005 with all secrets, Railway/Vercel vars, branch protection, first-deploy steps, and smoke test checklist.

### Completion Notes List

- All code-side tasks complete: `main.ts` PORT ✅, `docs/deployment.md` ✅.
- ACs 1–10 all require manual dashboard steps (Railway project creation, Vercel project creation, Clerk webhook registration, GitHub secrets, first deploy trigger, smoke test). Follow `docs/deployment.md` step-by-step.
- Story can be marked `review` after smoke test passes (users table row created on sign-up).

### File List

- `backend/src/main.ts` — already correct (no change)
- `docs/deployment.md` — created in S1-005, covers all S1-006 manual steps
