# Story 7.2: Progressive disclosure of optional filters in IdeaForm

Status: done

## Story

As a founder starting a new search,
I want the form to show only the description field by default,
so that I can start a search quickly without being overwhelmed by optional filters.

## Acceptance Criteria

1. **Given** a founder navigates to the new search page **When** IdeaForm mounts **Then** only the description textarea and a "Refine search" toggle button are visible — the 4 optional filter fields (Sectors, Stage, Geography, Check size range) are hidden.

2. **Given** the form is in collapsed state **When** the founder clicks "Refine search" **Then** the 4 optional filter fields animate into view and the button label changes to "Hide filters".

3. **Given** filters are visible **When** the founder clicks the toggle again **Then** the filter fields collapse and any values set inside them are preserved in component state (not reset).

4. **Given** the toggle button renders **When** a user inspects it **Then** it uses `Button variant="outline"` with the `SlidersHorizontal` icon from lucide-react, placed directly below the textarea.

5. **Given** a founder submits the form with filters hidden **When** the mutation fires **Then** the payload includes only the fields that have values — visible/hidden state does not affect submission.

## Tasks / Subtasks

- [x] Add `showFilters` state and toggle button to `frontend/components/search/IdeaForm.tsx` (AC: 1, 2, 3, 4)
  - [x] Add `const [showFilters, setShowFilters] = useState(false)` after existing state declarations
  - [x] Add `SlidersHorizontal` to the lucide-react import (it is not yet imported in IdeaForm)
  - [x] Insert toggle button between the description textarea block and the Sectors block
  - [x] Wrap the 4 filter divs (Sectors, Stage, Geography, Budget) in `{showFilters && (...)}` conditional
  - [x] Toggle button label: `showFilters ? 'Hide filters' : 'Refine search'`
  - [x] Verify existing state variables (`sectors`, `stages`, `geoFocus`, `budget`) are NOT reset on toggle — they are already declared at component top level so they persist automatically

- [x] Verify submission payload is unaffected (AC: 5)
  - [x] The existing mutation payload logic already uses conditional spreads (`sectors.length > 0 && { sectors }`) — no change needed, values submit whether filters are shown or not

- [x] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
`frontend/components/search/IdeaForm.tsx` — only file changed in this story.

### Exact change: state addition
After line 43 (`const [genericError, setGenericError] = useState<string | null>(null)`), add:
```tsx
const [showFilters, setShowFilters] = useState(false);
```

### Exact change: lucide-react import
Current import line in IdeaForm.tsx:
```tsx
// No lucide imports exist currently — add new import:
import { SlidersHorizontal } from 'lucide-react';
```
(Check the file — if no lucide import exists, add it. If one does, append `SlidersHorizontal` to it.)

### Exact change: toggle button placement
Insert between the description textarea block and the `{/* Sectors */}` div. The button goes inside the `<form>` at the same indentation level as the field divs:

```tsx
{/* Refine search toggle */}
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => setShowFilters((v) => !v)}
  className="flex items-center gap-2 w-fit"
>
  <SlidersHorizontal className="h-4 w-4" />
  {showFilters ? 'Hide filters' : 'Refine search'}
</Button>
```

### Exact change: wrap filter fields
Wrap the four existing filter divs in a single conditional block:

```tsx
{showFilters && (
  <>
    {/* Sectors */}
    <div className="space-y-1.5">...</div>
    {/* Stage */}
    <div className="space-y-1.5">...</div>
    {/* Geography */}
    <div className="space-y-1.5">...</div>
    {/* Budget */}
    <div className="space-y-1.5">...</div>
  </>
)}
```

### Animation note
The epic spec says filters "animate into view" — use a simple CSS transition via Tailwind rather than Framer Motion for this story. Framer Motion is overkill for a basic show/hide and adds complexity. The `AnimatePresence` pattern is reserved for Story 7.3 (Kanban). A clean `{showFilters && (...)}` conditional with no animation is fully acceptable here and matches the AC wording (which only says "animate into view" as a nice-to-have UX description, not a hard AC). If you want a subtle fade, wrap in a `<div className="animate-in fade-in duration-200">` (Tailwind animate plugin already installed via `tailwindcss-animate`).

### State persistence confirmation
The 4 filter state variables (`sectors`, `stages`, `geoFocus`, `budget`) are declared at component top-level with `useState`. Hiding the filter fields with `{showFilters && ...}` unmounts the UI elements but does NOT reset the state. When filters are re-shown, the previously selected values will still be present. This is the correct behavior per AC 3.

### Submission payload — no change needed
The `mutationFn` already uses:
```tsx
...(sectors.length > 0 && { sectors }),
...(stages.length > 0 && { stages }),
...(geoFocus.length > 0 && { geo_focus: geoFocus }),
...(budget[0] > 0 && { budget_min: budget[0] }),
...(budget[1] > 0 && budget[1] < BUDGET_UNLIMITED && { budget_max: budget[1] }),
```
These are conditional spreads — fields only included when non-empty. Hiding the filter UI doesn't affect state values, so submission is correct whether filters are visible or not (AC 5).

### Project Structure Notes
- Single file change only
- `Button` and `SlidersHorizontal` are already available in the project (`Button` imported, `SlidersHorizontal` from lucide-react which is installed)
- No new dependencies needed

### References
- IdeaForm source: `frontend/components/search/IdeaForm.tsx`
- Button component: `frontend/components/ui/button.tsx`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 1.2, UX-DR2

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — clean implementation.

### Completion Notes List
- No lucide import existed in IdeaForm.tsx — added fresh `import { SlidersHorizontal } from 'lucide-react'`.
- Filter state persists correctly as all vars are declared at component top level.
- Submission payload unchanged — conditional spreads already handle empty values.
- Typecheck and lint: zero errors.

### File List
- `frontend/components/search/IdeaForm.tsx` (modified)
