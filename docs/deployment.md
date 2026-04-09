# Deployment Guide

## Architecture

- **Frontend**: Next.js 14 → deployed to Vercel
- **Backend**: NestJS 10 → deployed to Railway
- **Database**: Supabase PostgreSQL (managed)
- **Queue**: Upstash Redis + BullMQ

## GitHub Repository Secrets

### CI workflow (`ci.yml`) — no secrets required
Unit tests run with mocks and `--passWithNoTests`. No live services needed.

### Deploy workflow (`deploy.yml`) — required secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token (Settings → Tokens) |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after first `vercel link` |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after first `vercel link` |
| `RAILWAY_TOKEN` | Railway project token (Project → Settings → Tokens) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `NEXT_PUBLIC_APP_URL` | Production URL e.g. `https://investormatch.app` |
| `SENTRY_DSN` | Optional — leave unset until S5-004; upload step is skipped when empty |

> **Do NOT add** `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`,
> `ANTHROPIC_API_KEY`, `CRUNCHBASE_API_KEY` to GitHub secrets. These are managed inside
> Railway's environment variable dashboard and Vercel's project settings respectively.

## Railway Environment Variables

Set these in Railway → Project → Variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
REDIS_URL=rediss://default:[token]@[host]:[port]
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
CRUNCHBASE_API_KEY=...
PORT=3001
```

## Vercel Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://investormatch.app
CLERK_SECRET_KEY=sk_live_...
```

## Branch Protection (Manual Step)

After the first CI run succeeds, configure branch protection on `main`:

1. GitHub → Settings → Branches → Add rule for `main`
2. Enable **Require status checks to pass before merging**
3. Add required checks: `Backend — typecheck + test` and `Frontend — typecheck`
4. Enable **Require branches to be up to date before merging**

## First Deploy (Manual Steps)

### 1. Supabase Database Setup
```bash
# Set DATABASE_URL in backend/.env (direct connection, port 5432)
cd backend
npm run migration:run
```

### 2. Vercel Frontend Linking
```bash
cd frontend
npx vercel link   # Creates .vercel/project.json
# Commit .vercel/project.json — CI uses VERCEL_PROJECT_ID from it
npx vercel --prod
```

### 3. Railway Backend Linking
```bash
cd backend
railway login
railway link      # Link to Railway project
railway up        # First deploy
```

### 4. Clerk Webhook Registration
In Clerk Dashboard → Webhooks → Add endpoint:
- URL: `https://your-railway-url.railway.app/api/v1/auth/webhook`
- Events: `user.created`, `user.updated`
- Copy the signing secret → set as `CLERK_WEBHOOK_SECRET` in Railway

## Smoke Test Checklist

After deploy, verify:
- [ ] `GET https://your-railway-url.railway.app/api/v1` → 404 (app running)
- [ ] Frontend loads at Vercel URL
- [ ] Sign-up creates a row in `users` table (check Supabase dashboard)
- [ ] No errors in Railway logs
