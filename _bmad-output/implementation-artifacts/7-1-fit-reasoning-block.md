# Story 7.1: Surface fit_reasoning above the fold on InvestorCard

Status: done

## Story

As a founder reviewing investor results,
I want to see Claude's plain-language explanation of why each investor matches my startup,
so that I can quickly assess fit without expanding additional panels.

## Acceptance Criteria

1. **Given** an InvestorCard renders with a non-null `fit_reasoning` value **When** the card mounts **Then** a FitReasoningBlock is displayed between the check range/geo row and the "Show Fit Details" toggle.

2. **Given** the FitReasoningBlock is rendered **When** a user views it **Then** it shows a "WHY THIS MATCH" label in 10px uppercase `text-primary`, reasoning text in italic 13px `text-muted-foreground`, a 2px left border in `border-primary/30`, and a `bg-primary/5` background tint.

3. **Given** an InvestorCard renders with a null `fit_reasoning` value **When** the card mounts **Then** no FitReasoningBlock is rendered and no empty space appears in its place.

4. **Given** dark mode is active **When** a FitReasoningBlock is displayed **Then** all colors resolve correctly from CSS variable tokens — no hardcoded values.

5. **Given** a developer imports FitReasoningBlock **When** they inspect the component's TypeScript interface **Then** props are typed as `{ reasoning: string; className?: string }` with the interface exported.

## Tasks / Subtasks

- [x] Create `frontend/components/investors/FitReasoningBlock.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] Export `FitReasoningBlockProps` interface: `{ reasoning: string; className?: string }`
  - [x] Render label `"WHY THIS MATCH"` with `text-[10px] uppercase font-semibold tracking-wide text-primary`
  - [x] Render reasoning text with `text-[13px] italic text-muted-foreground leading-snug`
  - [x] Wrap block in `border-l-2 border-primary/30 bg-primary/5 pl-3 pr-2 py-2 rounded-r-md`
  - [x] No render when reasoning is empty string (null guard is at call site in InvestorCard)

- [x] Update `frontend/components/investors/InvestorCard.tsx` (AC: 1, 3)
  - [x] Import `FitReasoningBlock`
  - [x] Add `InvestorProfile.fit_reasoning` render: place between the geo row (line ~135) and the "Show Fit Details" toggle (line ~138)
  - [x] Conditional: `{investor.fit_reasoning && <FitReasoningBlock reasoning={investor.fit_reasoning} />}`

- [x] Verify `fit_reasoning` exists on `InvestorProfile` type (AC: 5)
  - [x] Check `frontend/types/investor.ts` — field already present as `fit_reasoning: string | null`

- [x] Run `npm run typecheck && npm run lint` — zero errors (AC: 4, 5)

## Dev Notes

### File locations
- **New file:** `frontend/components/investors/FitReasoningBlock.tsx`
- **Modify:** `frontend/components/investors/InvestorCard.tsx` — insertion point is between the geo row (`<span>🌍...`) and the `<button>` that toggles `showBreakdown`
- **Possibly modify:** `frontend/types/investor.ts` — add `fit_reasoning: string | null` if not already present

### Exact InvestorCard insertion point
In `frontend/components/investors/InvestorCard.tsx`, the layout order is:
1. Header (avatar + name + FitScoreRing) — lines 72–105
2. Sector/stage badges — lines 107–122
3. Check range + geo row — lines 124–135
4. ← **Insert FitReasoningBlock here** (between geo and fit details toggle)
5. Fit Details toggle button — lines 138–143
6. FitBreakdown — line 146
7. Actions row — lines 148–203

### FitReasoningBlock exact styling spec
```tsx
// NO Framer Motion — this is static content, no animation needed
export interface FitReasoningBlockProps {
  reasoning: string;
  className?: string;
}

export function FitReasoningBlock({ reasoning, className }: FitReasoningBlockProps) {
  return (
    <div className={cn('border-l-2 border-primary/30 bg-primary/5 pl-3 pr-2 py-2 rounded-r-md', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">
        Why this match
      </p>
      <p className="text-[13px] italic text-muted-foreground leading-snug">
        {reasoning}
      </p>
    </div>
  );
}
```

### Color token rules (NFR3)
- DO NOT use hardcoded hex/rgb values
- `text-primary` → resolves to `hsl(var(--primary))` — dark navy in light, near-white in dark
- `border-primary/30` → 30% opacity primary border — works in both modes
- `bg-primary/5` → 5% opacity primary background tint — works in both modes
- `text-muted-foreground` → resolves to `hsl(var(--muted-foreground))` — slate gray in light, lighter in dark

### TypeScript interface requirement (NFR4)
- Export the interface `FitReasoningBlockProps` from the file
- `className?: string` is optional — allows InvestorCard to pass spacing overrides if needed

### No backend work needed
The `fit_reasoning` field is already stored in `investor_profiles` and returned by `GET /api/v1/searches/:id/investors`. No API changes required. Verify the field name in `frontend/types/investor.ts`.

### Project Structure Notes
- Component goes in `frontend/components/investors/` alongside `FitScoreRing.tsx`, `FitBreakdown.tsx` — consistent with the investor display component family
- File naming: `FitReasoningBlock.tsx` (PascalCase, matches project convention)
- No new shadcn/ui components needed — plain Tailwind divs only

### References
- InvestorCard source: `frontend/components/investors/InvestorCard.tsx`
- FitScoreRing (nearby component for style reference): `frontend/components/investors/FitScoreRing.tsx`
- FitBreakdown (nearby component): `frontend/components/investors/FitBreakdown.tsx`
- CSS tokens: `frontend/app/globals.css`
- InvestorProfile type: `frontend/types/investor.ts`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 1.1, UX-DR1

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — clean implementation.

### Completion Notes List
- `fit_reasoning: string | null` was already present in `frontend/types/investor.ts` — no type change needed.
- FitReasoningBlock inserted between geo row (line 135) and Fit Details toggle in InvestorCard.
- Typecheck and lint: zero errors.

### File List
- `frontend/components/investors/FitReasoningBlock.tsx` (new)
- `frontend/components/investors/InvestorCard.tsx` (modified)
