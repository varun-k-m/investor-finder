# Story S4-008: Dashboard — Search History + Quick Start

## User Story
As a founder, I want a dashboard showing my past searches and a quick-start button so that I can track my search history and immediately kick off a new discovery.

## Acceptance Criteria

1. Dashboard fetches `GET /api/v1/searches` (list of user's searches, newest first) via React Query
2. Each past search is shown as a card with: `raw_input` (truncated to 120 chars), `status` badge, `result_count`, formatted `created_at` date
3. Status badge colours: `pending`/`running` = yellow, `complete` = green, `failed` = red
4. Clicking a search card navigates to `/search/{id}`
5. "New Search" button at the top navigates to `/search`
6. Empty state: a hero prompt ("Start your first investor search") with a prominent "Find Investors" button linking to `/search`
7. Loading state: skeleton cards while fetching
8. `app/(app)/dashboard/page.tsx` renders the full dashboard content
9. `app/(app)/layout.tsx` renders a sidebar with nav links: Dashboard (`/dashboard`), New Search (`/search`), Saved (`/saved`), Settings (`/settings`)
10. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §8.1, §8.2, §5.2

**What already exists:**
- `frontend/lib/api.ts` — `apiFetch` from S4-001
- `frontend/app/(app)/layout.tsx` — empty shell (just renders `<main>{children}</main>`)
- `frontend/app/(app)/dashboard/page.tsx` — stub
- `frontend/components/ui/button.tsx` — shadcn Button

**`GET /api/v1/searches` response shape:**
The architecture §5.2 lists `GET /api/v1/searches` as returning the user's past searches. This endpoint may not yet be implemented in the backend. Check `backend/src/searches/searches.controller.ts`. If missing, add:
- `SearchesController`: `@Get()` → `searchesService.findAll(user.sub)`
- `SearchesService.findAll(clerkSub)` → find user, return `searchRepo.find({ where: { user_id: user.id }, order: { created_at: 'DESC' } })`
- No new tests required for this trivial read — existing test suite must still pass

```typescript
interface SearchSummary {
  id: string;
  raw_input: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result_count: number;
  created_at: string;
}
```

**What to build:**

### `frontend/types/search.ts`
```typescript
export interface SearchSummary {
  id: string;
  raw_input: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result_count: number;
  created_at: string;
}
```

### `frontend/app/(app)/layout.tsx` — Sidebar nav
Replace stub with a layout that includes:
- Left sidebar (fixed, `w-56`) with app logo/name and nav links using Next.js `<Link>`
- Links: Dashboard → `/dashboard`, New Search → `/search`, Saved → `/saved`, Settings → `/settings`
- Active link highlighted using `usePathname()` comparison
- `<main className="flex-1 ml-56">{children}</main>`

```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Search', href: '/search' },
  { label: 'Saved', href: '/saved' },
  { label: 'Settings', href: '/settings' },
];
```

### `frontend/app/(app)/dashboard/page.tsx`
- `'use client'`
- `useQuery` key: `['searches']`, `queryFn`: `apiFetch<SearchSummary[]>('/searches', getToken)`
- Loading: 3× skeleton cards
- Empty: hero with "Start your first investor search" heading + Link button to `/search`
- Loaded: grid of search history cards (1–2 col) + "New Search" button in header
- Search card: truncate `raw_input` at 120 chars, status badge, result count, formatted date (`new Date(created_at).toLocaleDateString()`)
- Card is a `<Link href={\`/search/${id}\`}>` wrapper

### shadcn/ui components to install (if needed)
Run: `npx shadcn@latest add skeleton` (if not already added in S4-004)

### Backend check: `GET /api/v1/searches` (list)
Before implementing the frontend, check if `SearchesController` has a `@Get()` route (no param) that returns all searches for the current user. If missing, add `findAll()` method to `SearchesService` and wire it.

## Tasks

- [x] Check if `GET /api/v1/searches` (list endpoint, no param) exists in backend; if not, implement it
- [x] Create `frontend/types/search.ts` — `SearchSummary` interface
- [x] Update `frontend/app/(app)/layout.tsx` — sidebar with nav links (AC: 9)
- [x] Update `frontend/app/(app)/dashboard/page.tsx` — full dashboard (AC: 1–8)
- [x] Run `npm run typecheck && npm run lint` — zero errors on frontend
- [x] Run `npm test` in backend — all tests still pass (if backend changes made)

## File List
- `frontend/types/search.ts` (new)
- `frontend/app/(app)/layout.tsx` (modified)
- `frontend/app/(app)/dashboard/page.tsx` (modified)
- `backend/src/searches/searches.controller.ts` (possibly modified — add `GET /searches` list)
- `backend/src/searches/searches.service.ts` (possibly modified — add `findAll()`)
- `backend/src/searches/searches.service.spec.ts` (possibly modified — add `findAll` test)

## Dev Agent Record

### Completion Notes
- Backend: added `SearchesService.findAll(clerkSub)` + `@Get()` route in `SearchesController`; 2 new tests added (92/92 ✅)
- `app/(app)/layout.tsx`: `'use client'` sidebar with active link detection via `usePathname()`; `w-56 fixed` sidebar + `ml-56 main`
- Dashboard: React Query `['searches']`; skeleton loading; empty hero with CTA; search history grid (2-col md+) with status badge, result count, date, link
- Status badges: yellow=pending/running, green=complete, red=failed
- frontend typecheck + lint: ✅ zero errors
