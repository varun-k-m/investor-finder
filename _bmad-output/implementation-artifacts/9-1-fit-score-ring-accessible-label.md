# Story 9.1: FitScoreRing SVG accessible label

Status: ready-for-dev

## Story

As a screen reader user viewing investor results,
I want the fit score ring to announce the score value,
so that I can understand fit quality without relying on the visual ring graphic.

## Acceptance Criteria

1. **Given** a FitScoreRing renders for an investor with score 78 **When** a screen reader focuses on it **Then** it announces "Fit score: 78 out of 100".

2. **Given** the FitScoreRing SVG renders **When** the DOM is inspected **Then** the `<svg>` element has a `<title>` child element containing "Fit score: {score} out of 100", an `id` of `fit-ring-{investorId}`, and `aria-labelledby` pointing to that `id`.

3. **Given** a null fit score **When** FitScoreRing does not render (existing null guard) **Then** no accessible label work is required.

## Tasks / Subtasks

- [ ] Update `frontend/components/investors/FitScoreRing.tsx` (AC: 1, 2, 3)
  - [ ] Update `FitScoreRingProps` interface: add `investorId: string` prop
  - [ ] Add `<title id={`fit-ring-${investorId}`}>Fit score: {rounded} out of 100</title>` as the first child inside `<svg>`
  - [ ] Add `aria-labelledby={`fit-ring-${investorId}`}` and `role="img"` to the `<svg>` element

- [ ] Update all call sites that render `<FitScoreRing>` to pass `investorId` (AC: 2)
  - [ ] `frontend/components/investors/InvestorCard.tsx` — pass `investor.id`
  - [ ] `frontend/components/saved/SavedBoard.tsx` (InvestorDetailModal) — pass `investor.id`

- [ ] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
Primary: `frontend/components/investors/FitScoreRing.tsx`
Call sites: `frontend/components/investors/InvestorCard.tsx`, `frontend/components/saved/SavedBoard.tsx`

### Exact FitScoreRing change

**Before:**
```tsx
interface FitScoreRingProps {
  score: number | null;
}

export function FitScoreRing({ score }: FitScoreRingProps) {
  if (score === null) return null;
  // ...
  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle ... />
        <circle ... />
      </svg>
      <span ...>{rounded}</span>
    </div>
  );
}
```

**After:**
```tsx
interface FitScoreRingProps {
  score: number | null;
  investorId: string;
}

export function FitScoreRing({ score, investorId }: FitScoreRingProps) {
  if (score === null) return null;
  // ...
  const titleId = `fit-ring-${investorId}`;
  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
      <svg
        className="w-12 h-12 -rotate-90"
        viewBox="0 0 48 48"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>Fit score: {rounded} out of 100</title>
        <circle ... />
        <circle ... />
      </svg>
      <span aria-hidden="true" className={cn('absolute text-[11px] font-bold rotate-0', color)}>
        {rounded}
      </span>
    </div>
  );
}
```

Note: Add `aria-hidden="true"` to the `<span>` that shows the number visually — it duplicates info already in the `<title>`, so hiding it from screen readers avoids double-reading.

### Call site updates

**InvestorCard.tsx** (current call, ~line 95):
```tsx
<FitScoreRing score={investor.fit_score} />
// →
<FitScoreRing score={investor.fit_score} investorId={investor.id} />
```

**SavedBoard.tsx** — InvestorDetailModal renders FitScoreRing (~line 87):
```tsx
<FitScoreRing score={investor.fit_score} />
// →
<FitScoreRing score={investor.fit_score} investorId={investor.id} />
```

### Why `role="img"` on the SVG
Without `role="img"`, some screen readers treat SVG as a generic container. Adding `role="img"` combined with `aria-labelledby` consistently triggers the accessible name announcement across VoiceOver (macOS/iOS), NVDA (Windows), and TalkBack (Android).

### Why `<title>` as first child
The `<title>` element must be the **first child** of `<svg>` for maximum screen reader compatibility. Placing it after the `<circle>` elements works in most modern browsers but first-child position is the spec-correct and most broadly supported approach.

### Project Structure Notes
- `investorId` is `investor.id` (string UUID) at all call sites — always available on `InvestorProfile`
- `FitScoreBadge.tsx` is a separate component (score badge, not ring) — it is not affected by this story

### References
- FitScoreRing source: `frontend/components/investors/FitScoreRing.tsx`
- InvestorCard source: `frontend/components/investors/InvestorCard.tsx`
- SavedBoard source: `frontend/components/saved/SavedBoard.tsx`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 3.1, UX-DR6

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
