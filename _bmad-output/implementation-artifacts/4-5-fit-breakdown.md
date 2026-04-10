# Story S4-005: FitBreakdown — Expandable Score Details

## User Story
As a founder, I want to expand an investor card to see detailed fit scores across each dimension so that I can understand why an investor is or isn't a strong match.

## Acceptance Criteria

1. `FitBreakdown` renders four score rows: Sector Fit, Stage Fit, Budget Fit, Geography Fit
2. Each row shows: a label, a horizontal progress bar filled to the score %, and the numeric score (e.g., "87%")
3. Progress bar colour matches the score tier: green ≥ 80, yellow ≥ 60, red < 60
4. `fit_reasoning` text is rendered below the score bars if non-null (italic, muted colour)
5. Gracefully handles `null` score values — shows "N/A" instead of a bar
6. `InvestorCard` replaces the `FitBreakdown stub` from S4-003 with the real `<FitBreakdown>` component
7. Expand/collapse toggle works smoothly (Framer Motion `AnimatePresence` + `motion.div` height animation, or CSS `grid-rows-[0fr/1fr]` technique)
8. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §8.2

**What already exists:**
- `frontend/types/investor.ts` — `InvestorProfile` with `sector_fit`, `stage_fit`, `budget_fit`, `geo_fit`, `fit_reasoning`
- `frontend/components/investors/InvestorCard.tsx` — has `showBreakdown` state + stub
- `framer-motion` v11 installed

**What to build:**

### `frontend/components/investors/FitBreakdown.tsx`
```typescript
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { InvestorProfile } from '@/types/investor';

interface Props {
  investor: InvestorProfile;
  open: boolean;
}

const DIMENSIONS = [
  { key: 'sector_fit', label: 'Sector Fit' },
  { key: 'stage_fit', label: 'Stage Fit' },
  { key: 'budget_fit', label: 'Budget Fit' },
  { key: 'geo_fit', label: 'Geography Fit' },
] as const;

function barColour(score: number) {
  return score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
}

export function FitBreakdown({ investor, open }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="pt-3 space-y-2">
            {DIMENSIONS.map(({ key, label }) => {
              const score = investor[key];
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-28 text-muted-foreground">{label}</span>
                  {score !== null ? (
                    <>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${barColour(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="w-10 text-right">{Math.round(score)}%</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
              );
            })}
            {investor.fit_reasoning && (
              <p className="text-xs text-muted-foreground italic pt-1">{investor.fit_reasoning}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Update `frontend/components/investors/InvestorCard.tsx`
- Import `FitBreakdown` from `@/components/investors/FitBreakdown`
- Replace the `<div>FitBreakdown stub</div>` with `<FitBreakdown investor={investor} open={showBreakdown} />`

## Tasks

- [x] Create `frontend/components/investors/FitBreakdown.tsx` — animated dimension scores (AC: 1–5, 7)
- [x] Update `frontend/components/investors/InvestorCard.tsx` — replace stub with real `FitBreakdown` (AC: 6)
- [x] Run `npm run typecheck && npm run lint` — zero errors

## File List
- `frontend/components/investors/FitBreakdown.tsx` (new)
- `frontend/components/investors/InvestorCard.tsx` (modified)

## Dev Agent Record

### Completion Notes
- `FitBreakdown`: Framer Motion `AnimatePresence` + `motion.div` height animation; 4 dimension rows with green/yellow/red bars; N/A for null scores; italic fit_reasoning
- `InvestorCard`: imported `FitBreakdown`, replaced stub with `<FitBreakdown investor={investor} open={showBreakdown} />`
- typecheck + lint: ✅ zero errors
