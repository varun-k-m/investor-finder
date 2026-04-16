# Story 9.5: Mobile touch target size compliance

Status: ready-for-dev

## Story

As a founder using InvestorMatch on a phone,
I want action buttons to be easy to tap accurately,
so that I don't mis-tap or have to zoom in to use the app.

## Acceptance Criteria

1. **Given** an InvestorCard renders on a mobile viewport (< 640px) **When** the Save and "Generate Pitch" buttons are inspected **Then** each button has a minimum tap target height of 44px.

2. **Given** a mobile user taps the Save button **When** they tap anywhere within the button's visible bounds **Then** the tap registers correctly.

3. **Given** the fix is implemented **When** the desktop layout renders at `lg:` breakpoint **Then** button sizes are unchanged from current design.

## Tasks / Subtasks

- [ ] Update action buttons in `frontend/components/investors/InvestorCard.tsx` (AC: 1, 2, 3)
  - [ ] Locate the Actions row (lines ~148–165): Save button and "Generate Pitch" button both use `size="sm"` (36px height)
  - [ ] Apply `className` override to increase height to 44px on mobile only, preserve desktop
  - [ ] Apply same fix to both buttons — Save (or `motion.button` if Story 8.1 is done) and "Generate Pitch"

- [ ] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
`frontend/components/investors/InvestorCard.tsx` only.

### Current state
Both action buttons in InvestorCard use `size="sm"`:
```tsx
<Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} ...>
  Save
</Button>
<Button size="sm" variant="outline" onClick={() => setShowPitch(true)}>
  Generate Pitch
</Button>
```

shadcn `size="sm"` renders `h-9` (36px) — below the WCAG 2.5.5 recommended 44px touch target on mobile.

### Fix: add `className` to increase mobile height

**Option A — add padding via className (recommended, no size change on desktop):**
```tsx
<Button
  size="sm"
  variant="outline"
  className="sm:h-9 h-11"   // 44px (h-11) on mobile, 36px (h-9) at sm: and above
  onClick={() => saveMutation.mutate()}
  disabled={saved || saveMutation.isPending}
>
```

`h-11` = 44px, `sm:h-9` = 36px at ≥640px. Mobile-first: `h-11` applies below 640px, `sm:h-9` overrides at 640px+.

Apply the same `className="sm:h-9 h-11"` to the "Generate Pitch" button.

**Option B — use size="default" at mobile (alternative):**
shadcn `size="default"` is `h-10` (40px) — still slightly under 44px. Not recommended for strict compliance.

**Use Option A** — it hits exactly 44px on mobile while keeping desktop at 36px.

### If Story 8.1 is already implemented (motion.button)
Story 8.1 replaces the Save `<Button>` with a `motion.button` that manually applies button CSS classes. In that case, apply the same `className` override to the `motion.button`'s `className` prop — add `sm:h-9 h-11` to the class string.

### Social link icons — not in scope
The social links (LinkedIn, Twitter, Website icons) in the actions row are icon-only `<a>` tags currently rendered at `h-4 w-4` (16px). WCAG 2.5.5 recommends 44px touch targets for these too, but they are **not in scope for this story** (only Save and Generate Pitch are specified in the AC). Do not expand scope.

### Desktop unchanged — AC3 verification
`sm:h-9` at Tailwind's `sm:` breakpoint (640px+) restores the original `h-9` height. The InvestorGrid is a 3-column layout on desktop — cards are not narrow on desktop, so the original `size="sm"` is intentional there.

### Project Structure Notes
- Single file change: `frontend/components/investors/InvestorCard.tsx`
- Two buttons modified: Save and Generate Pitch in the Actions row
- No new dependencies

### References
- InvestorCard source: `frontend/components/investors/InvestorCard.tsx`
- Button component: `frontend/components/ui/button.tsx`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 3.5, UX-DR8, FR11

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
