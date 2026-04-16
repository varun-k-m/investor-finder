# Story 7.3: Milestone quota card replaces amber warning banner

Status: done

## Story

As a founder who has used all 3 free searches,
I want the quota limit state to feel like an achievement rather than a hard stop,
so that I'm motivated to upgrade rather than feel blocked.

## Acceptance Criteria

1. **Given** a free-tier founder triggers the search quota limit (HTTP 429 or `limit reached` error) **When** the error is received by IdeaForm **Then** the MilestoneCard component renders in place of the current amber `quotaError` banner.

2. **Given** MilestoneCard renders **When** a user views it **Then** it shows: an icon circle, title "3 searches completed this month", motivating body copy, a progress bar filled to 100% (3/3), an "Upgrade to Pro ✨" primary CTA button, and a pricing anchor link.

3. **Given** MilestoneCard renders **When** a screen reader user focuses on it **Then** the container has `role="status"`, and the progress bar has `role="progressbar"` with `aria-valuenow` and `aria-valuemax`.

4. **Given** dark mode is active **When** MilestoneCard renders **Then** all colors use CSS variable tokens — blue accent and progress bar render correctly.

5. **Given** the MilestoneCard's "Upgrade to Pro" CTA is clicked **When** the click fires **Then** the `onUpgrade` prop callback is invoked (if provided) and the user is navigated to `/pricing`.

6. **Given** a developer creates MilestoneCard **When** they inspect the TypeScript interface **Then** props are typed as `{ used: number; limit: number; onUpgrade?: () => void }` with the interface exported from `components/search/MilestoneCard.tsx`.

## Tasks / Subtasks

- [x] Create `frontend/components/search/MilestoneCard.tsx` (AC: 2, 3, 4, 5, 6)
  - [x] Export `MilestoneCardProps` interface: `{ used: number; limit: number; onUpgrade?: () => void }`
  - [x] Container: `role="status"`, blue border + background using CSS tokens (see Dev Notes)
  - [x] Icon circle: trophy/star icon from lucide-react centered in a colored circle
  - [x] Title: `"{used} searches completed this month"`
  - [x] Body copy: motivating text, e.g. "You've explored {used} investor pools. Upgrade to keep the momentum going."
  - [x] Progress bar: `role="progressbar"`, `aria-valuenow={used}`, `aria-valuemax={limit}`, filled to `{(used/limit)*100}%`
  - [x] CTA button: `<Button>` variant primary, text "Upgrade to Pro ✨", `onClick` → calls `onUpgrade?.()` then `router.push('/pricing')`
  - [x] Pricing anchor: `<Link href="/pricing">View pricing</Link>` as secondary text link below CTA
  - [x] All colors via CSS tokens only (no hardcoded hex)

- [x] Update `frontend/components/search/IdeaForm.tsx` (AC: 1)
  - [x] Import `MilestoneCard`
  - [x] Replace the `{quotaError && <div className="rounded-md bg-amber-50...">...</div>}` amber banner block with `{quotaError && <MilestoneCard used={3} limit={3} onUpgrade={() => track('upgrade_clicked', { source: 'quota_error' })} />}`
  - [x] Remove the amber banner JSX entirely — MilestoneCard is the full replacement

- [x] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### New file location
`frontend/components/search/MilestoneCard.tsx` — placed in `search/` alongside `IdeaForm.tsx`, `MultiSelect.tsx`, `BudgetSlider.tsx`.

### MilestoneCard implementation guide

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface MilestoneCardProps {
  used: number;
  limit: number;
  onUpgrade?: () => void;
  className?: string;
}

export function MilestoneCard({ used, limit, onUpgrade, className }: MilestoneCardProps) {
  const router = useRouter();
  const pct = Math.min((used / limit) * 100, 100);

  function handleUpgrade() {
    onUpgrade?.();
    router.push('/pricing');
  }

  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3',
        className,
      )}
    >
      {/* Icon + title row */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <p className="font-semibold text-sm text-foreground">
          {used} search{used !== 1 ? 'es' : ''} completed this month
        </p>
      </div>

      {/* Body copy */}
      <p className="text-sm text-muted-foreground">
        You&apos;ve explored {used} investor pool{used !== 1 ? 's' : ''}. Upgrade to Pro for
        unlimited searches and keep the momentum going.
      </p>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${used} of ${limit} free searches used`}
        className="h-2 w-full rounded-full bg-primary/15 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button onClick={handleUpgrade} className="w-full">
          Upgrade to Pro ✨
        </Button>
        <Link
          href="/pricing"
          className="text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          View pricing
        </Link>
      </div>
    </div>
  );
}
```

### IdeaForm replacement — exact diff

**Remove** (lines ~163–178 in current IdeaForm.tsx):
```tsx
{quotaError && (
  <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm">
    <p className="font-medium text-amber-800">Monthly limit reached</p>
    <p className="text-amber-700 mt-1">
      You&apos;ve used all 3 free searches this month.{' '}
      <a href="/pricing" onClick={() => track('upgrade_clicked', { source: 'quota_error' })}
        className="underline font-medium hover:text-amber-900">
        Upgrade to Pro
      </a>{' '}
      for unlimited searches.
    </p>
  </div>
)}
```

**Replace with:**
```tsx
{quotaError && (
  <MilestoneCard
    used={3}
    limit={3}
    onUpgrade={() => track('upgrade_clicked', { source: 'quota_error' })}
  />
)}
```

### Color token rules (NFR3)
- Use `bg-primary/5`, `border-primary/30`, `bg-primary/10`, `bg-primary/15`, `text-primary` — all resolve correctly in light and dark mode
- No amber/hardcoded colors — `bg-amber-50`, `border-amber-200`, `text-amber-800` in the old banner are being removed entirely
- `text-foreground`, `text-muted-foreground` for text

### `used` value at call site
The IdeaForm has `FREE_LIMIT = 3` in the layout but not in IdeaForm itself. In IdeaForm, hardcode `used={3}` and `limit={3}` at the call site — MilestoneCard props accept dynamic values for future flexibility but the quota trigger is always at 3/3 for free tier.

### `useRouter` import
MilestoneCard needs `useRouter` from `'next/navigation'` (App Router). Already used in the project — no new setup needed.

### Project Structure Notes
- `components/search/` already has `IdeaForm.tsx`, `MultiSelect.tsx`, `BudgetSlider.tsx` — MilestoneCard fits here
- The amber banner being removed was the only amber color usage in IdeaForm — no other cleanup needed
- `track` import already exists in IdeaForm for the `onUpgrade` callback

### References
- IdeaForm source: `frontend/components/search/IdeaForm.tsx`
- AppLayout (for FREE_LIMIT reference): `frontend/app/(app)/layout.tsx` line 34
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 1.3, UX-DR3

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — clean implementation.

### Completion Notes List
- Amber banner fully removed from IdeaForm.tsx — no residual amber color tokens remain.
- MilestoneCard uses only CSS variable tokens (primary, muted-foreground, foreground) — no hardcoded hex.
- `aria-valuemin={0}` added to progressbar for full ARIA compliance alongside valuemax/valuenow.
- Typecheck and lint: zero errors.

### File List
- `frontend/components/search/MilestoneCard.tsx` (new)
- `frontend/components/search/IdeaForm.tsx` (modified)
