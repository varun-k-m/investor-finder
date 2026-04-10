# Story S4-007: Saved Investors Kanban Board

## User Story
As a founder, I want to see all my saved investors in a Kanban board organised by outreach status so that I can track my investor pipeline at a glance.

## Acceptance Criteria

1. `SavedBoard` fetches `GET /api/v1/users/me/saved` via React Query — returns array of `SavedInvestor` with nested `investor` (InvestorProfile)
2. Four columns rendered: Saved | Contacted | Replied | Passed (in that order)
3. Each card in a column shows: investor `canonical_name`, `fund_name`, `FitScoreBadge`, `InvestorStatusPill`
4. `InvestorStatusPill` renders the current status as a coloured pill (Saved=blue, Contacted=purple, Replied=green, Passed=grey)
5. Each card has a status dropdown/menu that calls `PUT /api/v1/investors/{investor_id}/status` with the new status on selection
6. After a status update succeeds, React Query invalidates `['saved']` to refetch and re-sort cards into the correct column
7. Empty column state: "No investors here yet" placeholder
8. Loading state: skeleton placeholders per column
9. `app/(app)/saved/page.tsx` renders `<SavedBoard />`
10. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §4.1, §5.3, §5.4, §8.2

**What already exists:**
- `frontend/lib/api.ts` — `apiFetch` from S4-001
- `frontend/types/investor.ts` — `InvestorProfile` from S4-003
- `frontend/components/investors/FitScoreBadge.tsx` — from S4-003
- `frontend/components/saved/` — empty directory

**`GET /api/v1/users/me/saved` response shape:**
```typescript
interface SavedInvestor {
  id: string;
  user_id: string;
  investor_id: string;
  status: 'saved' | 'contacted' | 'replied' | 'passed';
  notes: string | null;
  created_at: string;
  investor: InvestorProfile; // joined
}
```
Note: The backend `GET /api/v1/users/me/saved` endpoint is defined in the architecture §5.4 but may not yet be implemented on the backend. If the endpoint does not exist, implement a minimal backend endpoint as part of this story:
- `UsersController` `@Get('me/saved')` → `UsersService.getSavedInvestors(clerkSub)` → join `saved_investors` with `investor_profiles`

**`PUT /api/v1/investors/{id}/status` body:** `{ status: 'saved' | 'contacted' | 'replied' | 'passed' }`

**What to build:**

### `frontend/types/saved-investor.ts`
```typescript
import type { InvestorProfile } from './investor';
export interface SavedInvestor {
  id: string;
  user_id: string;
  investor_id: string;
  status: 'saved' | 'contacted' | 'replied' | 'passed';
  notes: string | null;
  created_at: string;
  investor: InvestorProfile;
}
```

### `frontend/components/saved/InvestorStatusPill.tsx`
Coloured pill: Saved=blue, Contacted=purple, Replied=green, Passed=grey.

### `frontend/components/saved/SavedBoard.tsx`
- `'use client'` component
- `useQuery` key: `['saved']`, `queryFn`: `apiFetch<SavedInvestor[]>('/users/me/saved', getToken)`
- Derive columns by filtering: `STATUSES.map(s => ({ status: s, items: data.filter(i => i.status === s) }))`
- Per card: show name, fund_name, `FitScoreBadge`, `InvestorStatusPill`
- Status change: `<select>` or dropdown menu (shadcn `DropdownMenu` or simple `<select>`) → `useMutation` PUT, on success invalidate `['saved']`
- Loading: skeleton columns; empty column: grey placeholder text

### `frontend/app/(app)/saved/page.tsx`
Replace stub with:
```typescript
import { SavedBoard } from '@/components/saved/SavedBoard';
export default function SavedPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Saved Investors</h1>
      <SavedBoard />
    </div>
  );
}
```

### Backend check: `GET /api/v1/users/me/saved`
Before implementing the frontend, verify this endpoint exists in `backend/src/users/users.controller.ts`. If missing, add:
- `UsersController`: `@Get('me/saved')` → return `usersService.getSavedInvestors(user.sub)`
- `UsersService.getSavedInvestors(clerkSub)` → `usersRepository.getSavedInvestors(userId)` → join `saved_investors LEFT JOIN investor_profiles`
- This is a minimal read-only endpoint — no extra auth guard needed (ClerkGuard global)

### shadcn/ui components to install (if needed)
Run: `npx shadcn@latest add select` (for status dropdown)

## Tasks

- [x] Check if `GET /api/v1/users/me/saved` exists in backend; if not, implement it (UsersController + UsersService + UsersRepository)
- [x] Create `frontend/types/saved-investor.ts`
- [x] Create `frontend/components/saved/InvestorStatusPill.tsx` (AC: 4)
- [x] Create `frontend/components/saved/SavedBoard.tsx` — Kanban board (AC: 1–8)
- [x] Update `frontend/app/(app)/saved/page.tsx` (AC: 9)
- [x] Run `npm run typecheck && npm run lint` — zero errors on frontend
- [x] Run `npm test` in backend — all tests pass (if backend changes made)

## File List
- `frontend/types/saved-investor.ts` (new)
- `frontend/components/saved/InvestorStatusPill.tsx` (new)
- `frontend/components/saved/SavedBoard.tsx` (new)
- `frontend/app/(app)/saved/page.tsx` (modified)
- `backend/src/users/users.controller.ts` (possibly modified — add `me/saved`)
- `backend/src/users/users.service.ts` (possibly modified)
- `backend/src/users/users.repository.ts` (possibly modified)

## Dev Agent Record

### Completion Notes
- Backend: created `UsersController` (new), added `getSavedInvestors` to `UsersService` + `UsersRepository`; `UsersRepository` now injects `SavedInvestor` repo; `UsersModule` registers `[User, SavedInvestor]` + `UsersController`
- `SavedBoard`: React Query `['saved']`; 4 Kanban columns; native `<select>` for status change (mutation → invalidate `['saved']`); skeleton loading + empty column states
- `InvestorStatusPill`: blue/purple/green/grey by status
- Backend tests: 90/90 ✅; frontend typecheck + lint: ✅
