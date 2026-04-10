# Story S5-002: Free Tier Quota Enforcement (3 Searches/Month)

## User Story
As a platform operator, I want free-tier users to be limited to 3 searches per month so that the business has a clear monetisation trigger.

## Acceptance Criteria

1. `QuotaGuard.FREE_LIMIT` is set to `3` (currently at 50 from dev testing — must be reverted)
2. When a free-tier user has used 3 or more searches this month, `POST /api/v1/searches` returns HTTP 429 with body `{ "message": "Monthly search limit reached. Upgrade to Pro for unlimited searches." }`
3. Pro and enterprise users bypass the quota check entirely
4. Frontend: when the backend returns 429, the `IdeaForm` displays the error message with a link to upgrade (not a generic error toast)
5. Dashboard sidebar shows current month usage: "X / 3 searches used" for free users (hidden for pro users)
6. Usage count is derived from `GET /api/v1/users/me` response (add `searches_this_month: number` to the response)
7. `GET /api/v1/users/me` endpoint exists and returns: `{ id, email, name, plan, searches_used, searches_this_month }`
8. All backend tests pass with 0 failures

## Technical Context

**Architecture refs:** §5.4 (users/me route), §4.1 (users table), §12 (QuotaGuard)

**What already exists:**
- `backend/src/common/guards/quota.guard.ts` — `FREE_LIMIT = 50` (dev override, must be reverted to 3)
- `backend/src/users/users.controller.ts` — has `GET /users/me/saved`; may not have `GET /users/me`
- `backend/src/users/users.service.ts` — has `findByClerkId`
- `frontend/components/search/IdeaForm.tsx` — `useMutation` POST `/searches`; currently shows generic error

**Backend changes:**

### 1. Revert `QuotaGuard.FREE_LIMIT` to 3
```typescript
private readonly FREE_LIMIT = 3;
```

### 2. Add `GET /api/v1/users/me` endpoint
In `UsersController`:
```typescript
@Get('me')
async getMe(@Req() req) {
  const user = await this.usersService.findByClerkId(req.user.sub);
  if (!user) throw new NotFoundException();
  const searchesThisMonth = await this.usersService.getMonthlySearchCount(user.id);
  return { ...user, searches_this_month: searchesThisMonth };
}
```

In `UsersService`:
```typescript
async getMonthlySearchCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return this.searchRepo.count({
    where: { user_id: userId, created_at: MoreThanOrEqual(startOfMonth) },
  });
}
```
Note: `UsersService` will need `searchRepo` injected (or delegate to `SearchesService`). Check for cleanest option — if `SearchesModule` exports `SearchesService`, import it into `UsersModule`.

**Frontend changes:**

### 3. IdeaForm — handle 429 specifically
In `frontend/components/search/IdeaForm.tsx`, on mutation error:
```typescript
onError: (error) => {
  if (error.message.includes('429') || error.message.includes('limit reached')) {
    setQuotaError(true);  // show upgrade prompt
  } else {
    setError(error.message);
  }
}
```
Show a distinct UI block when `quotaError === true`:
```tsx
<div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm">
  <p className="font-medium text-amber-800">Monthly limit reached</p>
  <p className="text-amber-700 mt-1">
    You've used all 3 free searches this month.{' '}
    <button onClick={handleUpgrade} className="underline font-medium">Upgrade to Pro</button>
    {' '}for unlimited searches.
  </p>
</div>
```

`handleUpgrade` calls `POST /api/v1/billing/create-checkout-session` and redirects.

### 4. Dashboard sidebar — usage counter
In `frontend/app/(app)/layout.tsx`:
- Fetch `GET /api/v1/users/me` via React Query `['user-me']`
- If `plan === 'free'`: show `{searches_this_month} / 3 searches used` below nav links, with a progress bar
- If `plan === 'pro'`: show "Pro Plan ✓" badge instead

## Tasks

- [x] Revert `QuotaGuard.FREE_LIMIT` from 50 → 3
- [x] Add `GET /api/v1/users/me` endpoint to `UsersController` returning user + `searches_this_month`
- [x] Add `getMonthlySearchCount(userId)` to `UsersService` (inject `SearchRepo` or delegate to `SearchesService`)
- [x] Write unit tests for `getMonthlySearchCount` in `UsersService.spec.ts`
- [x] Update `apiFetch` error handling to expose status code for 429 detection (if not already)
- [x] Update `IdeaForm` to detect 429 and show upgrade prompt with link
- [x] Add usage counter to dashboard sidebar in `app/(app)/layout.tsx`
- [x] Run full backend test suite — 0 failures
- [x] Run `npm run typecheck && npm run lint` in frontend — 0 errors

## File List
- `backend/src/common/guards/quota.guard.ts` (modified — FREE_LIMIT 50 → 3)
- `backend/src/users/users.controller.ts` (modified — add GET /me)
- `backend/src/users/users.service.ts` (modified — add getMonthlySearchCount)
- `backend/src/users/users.module.ts` (possibly modified — import SearchesModule or inject searchRepo)
- `backend/src/users/users.service.spec.ts` (modified — add tests for getMonthlySearchCount)
- `frontend/lib/api.ts` (possibly modified — surface status code in errors)
- `frontend/components/search/IdeaForm.tsx` (modified — 429 handling + upgrade prompt)
- `frontend/app/(app)/layout.tsx` (modified — usage counter in sidebar)

## Dev Agent Record

### Completion Notes
- `QuotaGuard.FREE_LIMIT` reverted 50 → 3
- `UsersModule` now includes `Search` entity for monthly count query (avoids circular dep with SearchesModule)
- `UsersRepository.getMonthlySearchCount` queries searches where `user_id = userId AND created_at >= start of month`
- `UsersController.getMe` returns `{ ...user, searches_this_month }` — used by sidebar + future Stripe gate
- `IdeaForm` detects `error.status === 429` → shows amber quota error block with `/pricing` link; invalidates `['user-me']` to refresh count
- Layout sidebar: progress bar (X/3) + "Upgrade to Pro ✨" link for free tier; "Pro Plan ✓" for pro
- `users.service.spec.ts` created: 5 tests — all pass
- Full backend suite: 97/97 ✅ | frontend typecheck + lint: ✅

### Change Log
- S5-002 (2026-04-10): Quota enforcement — FREE_LIMIT=3, GET /users/me with monthly count, 429 handling in IdeaForm, usage counter in sidebar
