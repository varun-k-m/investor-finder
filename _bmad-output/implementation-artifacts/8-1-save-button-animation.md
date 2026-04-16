# Story 8.1: Save button animation and status-specific colors

Status: ready-for-dev

## Story

As a founder saving an investor,
I want the Save button to animate and change color to reflect the saved state,
so that I have clear, satisfying confirmation that the action registered.

## Acceptance Criteria

1. **Given** a founder clicks the Save button **When** the save mutation succeeds **Then** the button plays a scale animation (briefly scales up then settles) and transitions to green background with white text.

2. **Given** the user's OS has `prefers-reduced-motion: reduce` **When** the save mutation succeeds **Then** the button state updates immediately with no scale animation.

3. **Given** `initialStatus="contacted"` **When** InvestorCard renders **Then** button renders in blue.

4. **Given** `initialStatus="replied"` **When** InvestorCard renders **Then** button renders in purple.

5. **Given** `initialStatus="passed"` **When** InvestorCard renders **Then** button renders in gray/muted.

6. **Given** the animation is applied **When** the DOM is inspected **Then** the button is wrapped in `motion.button` from framer-motion, all color values use Tailwind token classes — no hardcoded hex.

## Tasks / Subtasks

- [ ] Update `frontend/components/investors/InvestorCard.tsx` (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Add `useReducedMotion` to the existing `framer-motion` import (already imported via `AgentProgressBar` — confirm it's available in the package)
  - [ ] Import `motion` from `framer-motion`
  - [ ] Add `useReducedMotion()` hook call inside the component
  - [ ] Add status color map (see Dev Notes)
  - [ ] Replace the `<Button>` Save element with a `motion.button` that applies the scale animation on save success
  - [ ] Ensure `animate` prop is skipped when `reducedMotion` is true
  - [ ] Apply status-specific color classes derived from the color map

- [ ] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
`frontend/components/investors/InvestorCard.tsx` only.

### Framer Motion is already installed
`framer-motion` is already a project dependency (used in `AgentProgressBar.tsx` and `layout.tsx`). No install needed. Import: `import { motion, useReducedMotion } from 'framer-motion'`.

### Status color map — Tailwind tokens only (NFR3)
```tsx
const STATUS_COLORS: Record<InvestorStatus, string> = {
  saved:     'bg-green-600 text-white hover:bg-green-700 border-green-600',
  contacted: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
  replied:   'bg-purple-600 text-white hover:bg-purple-700 border-purple-600',
  passed:    'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
};
```
These use Tailwind color utilities — no hardcoded hex values (NFR3 compliant).

### Animation implementation
```tsx
const reducedMotion = useReducedMotion();
const [animating, setAnimating] = useState(false);

// In saveMutation.onSuccess, trigger animation:
onSuccess: () => {
  setSaved(true);
  setSavedStatus('saved');
  if (!reducedMotion) {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
  }
  track('investor_saved', { investor_id: investor.id, investor_name: investor.canonical_name });
},
```

Replace the `<Button>` Save element with:
```tsx
<motion.button
  type="button"
  onClick={() => saveMutation.mutate()}
  disabled={saved || saveMutation.isPending}
  animate={animating && !reducedMotion ? { scale: [1, 1.12, 1] } : { scale: 1 }}
  transition={{ duration: 0.35, ease: 'easeOut' }}
  className={cn(
    // Base button styles matching shadcn Button size="sm" variant="outline"
    'inline-flex items-center justify-center rounded-md text-sm font-medium',
    'h-9 px-3 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    saved && savedStatus
      ? STATUS_COLORS[savedStatus]
      : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
  )}
>
  {saved && savedStatus
    ? STATUS_LABELS[savedStatus]
    : saveMutation.isPending
      ? 'Saving...'
      : 'Save'}
</motion.button>
```

### Why `motion.button` instead of wrapping `<Button>`
shadcn `Button` renders a `<button>` element. Wrapping it in `motion.div` would create a `div > button` nesting which can cause accessibility issues (`div` intercepts pointer events). Using `motion.button` directly and replicating the Button's CSS classes is the correct approach. Copy the relevant Tailwind classes from `frontend/components/ui/button.tsx` `size="sm" variant="outline"` to match existing appearance.

### `animating` state vs `animate` prop
The `animate` prop can remain `{ scale: 1 }` at rest (no visual change). Only set the scale keyframes during the brief animation window. Using a local `animating` boolean state with a `setTimeout` is simpler and more reliable than tracking mutation lifecycle for this purely visual concern.

### `useReducedMotion` null handling
`useReducedMotion()` can return `null` on SSR. Treat `null` as `false` (allow animation): `const reducedMotion = useReducedMotion() ?? false`. Same pattern used in `AgentProgressBar.tsx` line 234.

### Project Structure Notes
- All changes in one file: `frontend/components/investors/InvestorCard.tsx`
- `framer-motion` already installed — no package changes
- `InvestorStatus` type already imported from `'@/types/saved-investor'` at line 19
- `STATUS_LABELS` constant already defined at lines 21–26 — no duplication needed

### References
- InvestorCard source: `frontend/components/investors/InvestorCard.tsx`
- AgentProgressBar (useReducedMotion pattern): `frontend/components/search/AgentProgressBar.tsx` line 234
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 2.1, UX-DR4

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
