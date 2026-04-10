# Story S5-005: PostHog Analytics — Helper Functions (API key deferred)

## User Story
As a developer, I want PostHog tracking functions wired throughout the app so that adding NEXT_PUBLIC_POSTHOG_KEY immediately activates analytics with no further code changes.

## Acceptance Criteria

1. `frontend/lib/posthog.ts` created with `initPostHog()`, `track()`, and `identify()` helpers — all gated on `NEXT_PUBLIC_POSTHOG_KEY`; no-op silently if key is absent
2. `posthog-js` installed in frontend
3. `initPostHog()` called once via `useEffect` in `frontend/app/providers.tsx`
4. `identify(userId, { email, plan })` called in `frontend/app/(app)/layout.tsx` after user + plan data loads
5. The following events are tracked (all no-ops if key missing):
   - `search_started` — `IdeaForm.tsx` mutation `onSuccess`; props: `{ search_id }`
   - `search_completed` — `useAgentStream.ts` SSE `complete` handler; props: `{ search_id, result_count }`
   - `investor_saved` — `InvestorCard.tsx` save mutation `onSuccess`; props: `{ investor_id, investor_name }`
   - `pitch_generated` — `PitchModal.tsx` after successful generation; props: `{ investor_id, investor_name }`
   - `upgrade_clicked` — pricing link in sidebar + quota error upgrade button; props: `{ source: 'sidebar' | 'quota_error' }`
6. `npm run typecheck && npm run lint` pass in frontend with 0 errors

## Technical Context

**Architecture refs:** §3 (PostHog)

**Env var (deferred — add later):**
- `NEXT_PUBLIC_POSTHOG_KEY` — Vercel env var
- `NEXT_PUBLIC_POSTHOG_HOST` — optional, defaults to `https://app.posthog.com`

**Install:**
```bash
cd frontend && npm install posthog-js
```

**`frontend/lib/posthog.ts`:**
```typescript
import posthog from 'posthog-js';

let initialised = false;

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialised || typeof window === 'undefined') return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialised = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}
```

**`frontend/app/providers.tsx` — add init:**
```typescript
import { useEffect } from 'react';
import { initPostHog } from '../lib/posthog';

// Inside Providers component, before return:
useEffect(() => { initPostHog(); }, []);
```

**`frontend/app/(app)/layout.tsx` — add identify:**
After `useUser()` from Clerk and `useQuery(['user-me'])` resolve:
```typescript
import { identify } from '../../lib/posthog';

useEffect(() => {
  if (clerkUser?.id && meData) {
    identify(clerkUser.id, {
      email: clerkUser.primaryEmailAddress?.emailAddress,
      plan: meData.plan,
    });
  }
}, [clerkUser, meData]);
```

**Event tracking locations:**

| Event | File | Trigger |
|-------|------|---------|
| `search_started` | `IdeaForm.tsx` | `onSuccess` of POST `/searches` mutation |
| `search_completed` | `hooks/useAgentStream.ts` | SSE `complete` event handler |
| `investor_saved` | `InvestorCard.tsx` | `onSuccess` of save mutation |
| `pitch_generated` | `PitchModal.tsx` | after pitch text is successfully received |
| `upgrade_clicked` | `layout.tsx` sidebar + `IdeaForm.tsx` quota error | onClick of upgrade/pricing link |

**Pattern for each location:**
```typescript
import { track } from '@/lib/posthog';  // or adjust relative path

// In handler:
track('search_started', { search_id: data.id });
```

## Tasks

- [x] Install `posthog-js` in frontend
- [x] Create `frontend/lib/posthog.ts` with `initPostHog`, `track`, `identify`
- [x] Add `initPostHog()` in `useEffect` inside `frontend/app/providers.tsx`
- [x] Add `identify()` call in `frontend/app/(app)/layout.tsx` after user + meData loads
- [x] Add `track('search_started', ...)` in `IdeaForm.tsx` mutation `onSuccess`
- [x] Add `track('search_completed', ...)` in `hooks/useAgentStream.ts` SSE complete handler
- [x] Add `track('investor_saved', ...)` in `InvestorCard.tsx` save mutation `onSuccess`
- [x] Add `track('pitch_generated', ...)` in `PitchModal.tsx` after pitch generation
- [x] Add `track('upgrade_clicked', { source: 'sidebar' })` to pricing link in sidebar
- [x] Add `track('upgrade_clicked', { source: 'quota_error' })` to upgrade link in IdeaForm quota error
- [x] Run `npm run typecheck && npm run lint` — 0 errors

## File List
- `frontend/lib/posthog.ts` (new)
- `frontend/app/providers.tsx` (modified — initPostHog)
- `frontend/app/(app)/layout.tsx` (modified — identify)
- `frontend/components/search/IdeaForm.tsx` (modified — search_started + upgrade_clicked)
- `frontend/hooks/useAgentStream.ts` (modified — search_completed)
- `frontend/components/investors/InvestorCard.tsx` (modified — investor_saved)
- `frontend/components/investors/PitchModal.tsx` (modified — pitch_generated)

## Dev Agent Record

### Completion Notes
- `posthog-js` installed; `lib/posthog.ts` with `initPostHog` / `track` / `identify` — all gated on `NEXT_PUBLIC_POSTHOG_KEY`, no-op if absent
- `initPostHog()` called once in `providers.tsx` via `useEffect`
- `identify(userId, { email, plan })` wired in `app/(app)/layout.tsx` after Clerk user + `meData` both resolve
- 5 events wired: `search_started`, `search_completed` (with `result_count` from SSE data), `investor_saved`, `pitch_generated`, `upgrade_clicked` (sidebar + quota_error sources)
- typecheck + lint: ✅ zero errors

### Change Log
- S5-005 (2026-04-10): PostHog analytics stubs — helpers + all 5 events wired, gated on NEXT_PUBLIC_POSTHOG_KEY
