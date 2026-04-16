# Story 9.6: SavedBoard horizontal scroll with iOS momentum

Status: ready-for-dev

## Story

As a founder reviewing their pipeline on an iPhone,
I want the Kanban board to scroll smoothly between columns,
so that I can navigate all 4 status columns without friction.

## Acceptance Criteria

1. **Given** a founder opens the SavedBoard on an iOS device (Safari Mobile) **When** they swipe horizontally across the Kanban columns **Then** the scroll has iOS momentum (continues to decelerate after finger lifts).

2. **Given** the SavedBoard Kanban wrapper renders **When** a developer inspects the DOM **Then** the columns wrapper has `overflow-x-auto` and `-webkit-overflow-scrolling: touch` applied.

3. **Given** the fix is applied **When** the layout renders on desktop (≥ 1024px) **Then** all 4 columns display side by side without horizontal scroll.

## Tasks / Subtasks

- [ ] Update `frontend/components/saved/SavedBoard.tsx` — Kanban columns wrapper (AC: 1, 2, 3)
  - [ ] Find the outermost columns wrapper `<div className="flex gap-3 overflow-x-auto pb-4 items-start">` (line ~290)
  - [ ] `overflow-x-auto` is already present — just needs `-webkit-overflow-scrolling: touch` added
  - [ ] Add via inline style: `style={{ WebkitOverflowScrolling: 'touch' }}`

- [ ] Verify desktop layout unaffected (AC: 3)
  - [ ] The existing `flex gap-3` layout shows 4 columns side by side on desktop — `overflow-x-auto` only activates when content exceeds container width (mobile), not on desktop where the full width is available

- [ ] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
`frontend/components/saved/SavedBoard.tsx` only. Minimal change.

### Exact change

The Kanban columns wrapper is at approximately line 290 in `SavedBoard.tsx`:

**Before:**
```tsx
<div className="flex gap-3 overflow-x-auto pb-4 items-start">
```

**After:**
```tsx
<div
  className="flex gap-3 overflow-x-auto pb-4 items-start"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

That's the complete change. One attribute addition.

### Why inline style (not Tailwind class)
`-webkit-overflow-scrolling: touch` is a vendor-prefixed CSS property that Tailwind does not expose as a utility class. It must be applied as an inline style using the React camelCase property name `WebkitOverflowScrolling`.

Alternatively, it could be added to `globals.css` as a utility class:
```css
@layer utilities {
  .overflow-scroll-touch {
    -webkit-overflow-scrolling: touch;
  }
}
```
But the inline style is simpler and keeps the change localized to the component.

### `overflow-x-auto` is already present
The wrapper already has `overflow-x-auto` on line 290 (also on the skeleton loading div at line 277). No change needed for that property. Only the webkit touch scrolling is missing.

### iOS momentum scrolling behavior
`-webkit-overflow-scrolling: touch` enables the native iOS "momentum" (inertial) scrolling behavior on overflow containers. Without it, iOS Safari uses a "stop on lift" scroll that feels unnatural. This has been the standard iOS scroll fix since iOS 5. Note: in iOS 13+, momentum scrolling is the default for `overflow: auto` containers, but explicitly setting this property ensures compatibility with older iOS versions and avoids edge cases.

### Desktop behavior — AC3 confirmation
On desktop (1024px+), all 4 Kanban columns fit within the viewport width. The `flex` layout with `min-w-[220px]` per column at 4 columns = 880px minimum — fits in a 1024px+ viewport with the 56px sidebar. `overflow-x-auto` only creates a scrollbar when content overflows. On desktop there is no overflow, so no horizontal scrollbar appears.

The skeleton loading state at line 277 also has `overflow-x-auto` — apply the same inline style there for consistency:
```tsx
<div className="flex gap-4 overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
```

### Project Structure Notes
- Single file change: `frontend/components/saved/SavedBoard.tsx`
- Two divs modified: main Kanban wrapper + skeleton loading wrapper (consistency)
- No new dependencies, no globals.css changes needed (inline style is fine)

### References
- SavedBoard source: `frontend/components/saved/SavedBoard.tsx`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 3.6, UX-DR9, FR12

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
