# Story S4-004: InvestorGrid — Paginated Results View

## User Story
As a founder, I want to browse all discovered investors in a paginated grid so that I can efficiently review all matches from my search.

## Acceptance Criteria

1. `InvestorGrid` fetches `GET /api/v1/searches/{searchId}/investors?page={page}&limit=20` using React Query
2. Renders a responsive grid of `InvestorCard` components (1 col mobile, 2 col md, 3 col lg)
3. Shows pagination controls (Previous / Next) at the bottom; Previous disabled on page 1, Next disabled when `page * limit >= total`
4. Shows current page info: "Showing X–Y of Z investors"
5. Shows a loading skeleton (3 placeholder cards) while fetching
6. Shows an empty state message ("No investors found yet") when `total === 0`
7. `app/(app)/search/[id]/page.tsx` renders `<InvestorGrid searchId={id} />` when `status === 'complete'`
8. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §5.3, §8.2

**What already exists:**
- `frontend/components/investors/InvestorCard.tsx` — from S4-003
- `frontend/types/investor.ts` — `InvestorProfile` interface from S4-003
- `frontend/lib/api.ts` — `apiFetch` from S4-001
- `frontend/app/(app)/search/[id]/page.tsx` — renders `AgentProgressBar` while running; stub for results

**API response shape:**
```typescript
interface InvestorsResponse {
  data: InvestorProfile[];
  total: number;
  page: number;
  limit: number;
}
```

**What to build:**

### `frontend/components/investors/InvestorGrid.tsx`
- `'use client'` component
- Props: `{ searchId: string }`
- Local state: `page: number` (default 1)
- `useQuery` key: `['investors', searchId, page]`
- `queryFn`: `apiFetch<InvestorsResponse>(\`/searches/${searchId}/investors?page=${page}&limit=20\`, getToken)`
- Render logic:
  - `isPending`: 3× skeleton placeholder divs (`animate-pulse bg-muted rounded-lg h-48`)
  - `data.data.length === 0`: empty state message
  - Otherwise: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">` with `InvestorCard` per investor
- Pagination: Previous/Next buttons + "Showing X–Y of Z"

### Update `frontend/app/(app)/search/[id]/page.tsx`
Replace the `<div>Results here</div>` stub from S4-002 with `<InvestorGrid searchId={id} />`.

### shadcn/ui components to install (if not already)
Run: `npx shadcn@latest add skeleton` for loading state (optional — can use Tailwind animate-pulse)

## Tasks

- [x] Create `frontend/components/investors/InvestorGrid.tsx` — paginated grid with loading/empty states (AC: 1–6)
- [x] Update `frontend/app/(app)/search/[id]/page.tsx` — replace stub with `<InvestorGrid>` (AC: 7)
- [x] Run `npm run typecheck && npm run lint` — zero errors

## File List
- `frontend/components/investors/InvestorGrid.tsx` (new)
- `frontend/app/(app)/search/[id]/page.tsx` (modified)

## Dev Agent Record

### Completion Notes
- `InvestorGrid`: React Query key `['investors', searchId, page]`; Tailwind animate-pulse skeletons; empty state; responsive grid 1/2/3 col; Previous/Next pagination with bounds check
- `search/[id]/page.tsx`: replaced stub with `<InvestorGrid searchId={id} />` when status === 'complete'
- typecheck + lint: ✅ zero errors
