# Story S5-001: Billing UI (Stripe integration deferred)

## User Story
As a founder, I want to see an upgrade CTA and a pricing page so that I understand the Pro plan benefits and can upgrade when billing goes live.

## Acceptance Criteria

1. Dashboard sidebar shows an "Upgrade to Pro" button for free-tier users (hidden for pro users)
2. Clicking "Upgrade to Pro" navigates to `/pricing` (Next.js route)
3. `/pricing` page shows two plan cards: **Free** (3 searches/month) and **Pro** (unlimited searches, $X/mo)
4. Pro plan card has a "Get Pro" button — for now it shows a "Coming soon" toast/alert (no Stripe call yet)
5. Dashboard shows `?upgraded=true` success banner: "Welcome to Pro! Unlimited searches unlocked." (for future use after Stripe goes live)
6. `GET /api/v1/users/me` response includes `plan` field so the sidebar knows which plan the user is on
7. `frontend/app/(app)/layout.tsx` fetches `GET /api/v1/users/me` via React Query `['user-me']`; if `plan === 'free'`, shows upgrade button
8. No Stripe SDK installed, no backend billing endpoints — pure UI only
9. `npm run typecheck && npm run lint` pass in frontend with 0 errors

## Technical Context

**Architecture refs:** §5.4 (users/me), §3 (Stripe — deferred)

**Note:** Stripe SDK and backend billing endpoints are deferred. This story is UI scaffolding only. The `GET /api/v1/users/me` endpoint is shared with S5-002 — if S5-002 is implemented first, this endpoint already exists.

**Frontend — `/pricing` page:**
```
frontend/app/(app)/pricing/page.tsx
```
Two plan cards side by side:

```tsx
// Free plan card
<div className="border rounded-xl p-6">
  <h2>Free</h2>
  <p className="text-3xl font-bold">$0 <span className="text-sm font-normal">/month</span></p>
  <ul>
    <li>3 investor searches/month</li>
    <li>AI-powered matching</li>
    <li>Pitch draft generation</li>
  </ul>
  <button disabled className="w-full mt-4">Current Plan</button>
</div>

// Pro plan card
<div className="border-2 border-blue-500 rounded-xl p-6">
  <div className="text-xs text-blue-600 font-semibold uppercase mb-2">Most Popular</div>
  <h2>Pro</h2>
  <p className="text-3xl font-bold">$49 <span className="text-sm font-normal">/month</span></p>
  <ul>
    <li>Unlimited searches</li>
    <li>Priority AI processing</li>
    <li>Advanced fit scoring</li>
    <li>Email notifications</li>
  </ul>
  <button onClick={handleGetPro} className="w-full mt-4 bg-blue-600 text-white ...">
    Get Pro
  </button>
</div>
```

`handleGetPro` shows an inline message: "Billing coming soon — we'll notify you when Pro is available!"

**Sidebar upgrade button (`app/(app)/layout.tsx`):**
```tsx
{meData?.plan === 'free' && (
  <Link href="/pricing" className="block mt-4 text-center text-sm bg-blue-600 text-white rounded-lg py-2 px-3 hover:bg-blue-700">
    Upgrade to Pro ✨
  </Link>
)}
```

**Success banner (dashboard):**
```tsx
// In dashboard/page.tsx — check useSearchParams for ?upgraded=true
{searchParams.get('upgraded') === 'true' && (
  <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4 text-green-800 text-sm flex justify-between">
    <span>Welcome to Pro! Unlimited searches unlocked. 🎉</span>
    <button onClick={() => router.replace('/dashboard')}>✕</button>
  </div>
)}
```

## Tasks

- [x] Fetch `GET /api/v1/users/me` in `app/(app)/layout.tsx` via React Query `['user-me']`; show "Upgrade to Pro" link if `plan === 'free'`
- [x] Create `frontend/app/(app)/pricing/page.tsx` — two plan cards (Free + Pro) with "coming soon" on Get Pro
- [x] Add `?upgraded=true` success banner to `frontend/app/(app)/dashboard/page.tsx`
- [x] Run `npm run typecheck && npm run lint` — 0 errors

## File List
- `frontend/app/(app)/pricing/page.tsx` (new)
- `frontend/app/(app)/layout.tsx` (modified — fetch /users/me, show upgrade button)
- `frontend/app/(app)/dashboard/page.tsx` (modified — success banner)

## Dev Agent Record

### Completion Notes
- Added `GET /users/me` to `UsersController` — returns full User entity (includes `plan` field)
- Layout now fetches `['user-me']` via React Query; shows "Upgrade to Pro ✨" link if `plan === 'free'`, "Pro Plan ✓" badge if pro
- `/pricing` page: two plan cards (Free/$0 + Pro/$49), "Get Pro" shows inline "coming soon" message, "Current Plan" button disabled
- Dashboard: `useSearchParams` + `useRouter` detect `?upgraded=true` → green dismissible banner
- typecheck + lint: ✅ zero errors

### Change Log
- S5-001 (2026-04-10): Billing UI scaffold — pricing page, sidebar upgrade CTA, dashboard success banner, GET /users/me endpoint
