# Story 8.3: Kanban card pop-in animation on SavedBoard

Status: done

## Story

As a founder moving investors through the pipeline,
I want cards to animate into their column when status changes,
so that the Kanban board feels responsive and confirms the action clearly.

## Acceptance Criteria

1. **Given** an investor's status is updated **When** the card appears in the new column **Then** it animates in with a spring entry (opacity 0→1, y: 12→0, spring stiffness 300, damping 24).

2. **Given** `prefers-reduced-motion: reduce` is enabled **When** a card moves to a new column **Then** the card appears immediately with no animation.

3. **Given** the SavedBoard renders with existing cards on mount **When** the component first loads **Then** pre-existing cards do not animate — only newly arriving cards animate in.

4. **Given** a card animation plays **When** the DOM is inspected **Then** each card is wrapped in `motion.div` from framer-motion, and the parent column uses `AnimatePresence`.

## Tasks / Subtasks

- [x] Update `frontend/components/saved/SavedBoard.tsx` — wrap card list with AnimatePresence (AC: 1, 2, 3, 4)
  - [x] Import `AnimatePresence, motion, useReducedMotion` from `framer-motion`
  - [x] Add `const reducedMotion = useReducedMotion() ?? false` in the `SavedBoard` component
  - [x] In each column's cards section, wrap the `column.map(...)` in `<AnimatePresence initial={false}>`
  - [x] Replace the card's outer `<div key={item.id} draggable ...>` with `<motion.div>` — preserve all existing drag handlers, className, and aria attributes
  - [x] Add spring animation props to `motion.div` (see Dev Notes)
  - [x] Guard animation with `reducedMotion`: when true, pass empty `initial`/`animate`/`exit` objects

- [x] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
`frontend/components/saved/SavedBoard.tsx` only.

### Framer Motion already installed
`framer-motion` is already used in `layout.tsx` and `AgentProgressBar.tsx`. No install needed. The SavedBoard file does not currently import framer-motion — add the import.

### Exact animation spec
```tsx
// In SavedBoard component:
const reducedMotion = useReducedMotion() ?? false;

// Animation variants for card
const cardVariants = {
  initial: reducedMotion ? {} : { opacity: 0, y: 12 },
  animate: reducedMotion ? {} : { opacity: 1, y: 0 },
  exit:    reducedMotion ? {} : { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 24,
};
```

### Card wrapper change — preserve all existing attributes

**Before** (in the `column.map` block):
```tsx
<div
  key={item.id}
  draggable
  className={cn(...)}
  onDragStart={...}
  onDragEnd={...}
  onClick={...}
  role="button"
  tabIndex={0}
  onKeyDown={...}
  aria-label={...}
>
```

**After:**
```tsx
<AnimatePresence initial={false}>
  {column.map((item) => {
    // ... existing isDragged / isUpdating locals ...
    return (
      <motion.div
        key={item.id}
        draggable
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={springTransition}
        layout
        className={cn(...)}  // keep identical className
        onDragStart={...}    // keep all drag handlers
        onDragEnd={...}
        onClick={...}
        role="button"
        tabIndex={0}
        onKeyDown={...}
        aria-label={...}
      >
        {/* card content unchanged */}
      </motion.div>
    );
  })}
</AnimatePresence>
```

### `AnimatePresence initial={false}` — critical for AC3
`initial={false}` on `AnimatePresence` tells Framer Motion to skip the entry animation for children that are present when the component **first mounts**. Without this, ALL cards would animate in when the page loads — which violates AC3.

With `initial={false}`: 
- Cards on mount → no animation
- Cards added after mount (status change) → spring entry animation ✓

### `layout` prop on `motion.div`
Adding `layout` enables Framer Motion's layout animation — when a card is removed from one column, remaining cards smoothly fill the gap. This is a free UX improvement that requires no extra config. Guard it too: set `layout={!reducedMotion}`.

### `useReducedMotion` null handling
`useReducedMotion()` returns `null` on server render. Use `?? false` fallback — same pattern as `AgentProgressBar.tsx` line 234.

### Drag-and-drop compatibility
The existing card already uses native HTML5 drag (`draggable`, `onDragStart`, `onDragEnd`). `motion.div` is fully compatible with native drag — it does not intercept or override drag events. No changes to drag logic needed.

### `AnimatePresence` placement
Place `<AnimatePresence initial={false}>` as a direct wrapper around the `column.map()` call. Do NOT wrap the entire column `div` — only the card list needs it. The empty-state `div` ("No investors") should remain outside AnimatePresence.

### Project Structure Notes
- Single file change: `frontend/components/saved/SavedBoard.tsx`
- `framer-motion` already installed, just needs import added
- The `InvestorDetailModal` component at the bottom of the file is unaffected

### References
- SavedBoard source: `frontend/components/saved/SavedBoard.tsx`
- AgentProgressBar (AnimatePresence + useReducedMotion pattern): `frontend/components/search/AgentProgressBar.tsx`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 2.3, UX-DR5

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None.

### Completion Notes List
- `AnimatePresence initial={false}` wraps `column.map()` — mount-time cards skip animation (AC3)
- `motion.div` with spring `{ stiffness: 300, damping: 24 }` replaces card `<div>`
- `layout={!reducedMotion}` enables smooth gap-fill when cards leave columns
- Native HTML5 drag `onDragStart` event cast to `React.DragEvent<HTMLDivElement>` via `unknown` — required because `motion.div` overrides `onDragStart` type to framer-motion's `PointerEvent`-based signature; runtime behavior unchanged
- Added `React` namespace import for `React.DragEvent` type reference

### File List
- `frontend/components/saved/SavedBoard.tsx`
