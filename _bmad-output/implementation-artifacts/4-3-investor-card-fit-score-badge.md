# Story S4-003: InvestorCard + FitScoreBadge Components

## User Story
As a founder viewing results, I want a card for each investor showing their key details and how well they match my idea so that I can quickly evaluate each investor.

## Acceptance Criteria

1. `FitScoreBadge` renders a coloured pill with the fit score %:
   - `fit_score >= 80` → green (`bg-green-100 text-green-800`)
   - `fit_score >= 60` → yellow (`bg-yellow-100 text-yellow-800`)
   - `fit_score < 60` → red (`bg-red-100 text-red-800`)
2. `InvestorCard` displays: `canonical_name`, `fund_name`, sector tags (`sectors[]`), `FitScoreBadge`
3. `InvestorCard` shows a "Save" button that calls `POST /api/v1/investors/{id}/save`; button changes to "Saved" (disabled) after success
4. `InvestorCard` shows a "Generate Pitch" button — clicking it opens `PitchModal` (stub: `alert('PitchModal — S4-006')` until S4-006 is implemented)
5. `InvestorCard` shows an expandable "Fit Details" toggle — clicking it shows `FitBreakdown` (stub: `<div>FitBreakdown — S4-005</div>` until S4-005)
6. Card handles missing optional fields gracefully (no crash on `null` fund_name, empty sectors, etc.)
7. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §4.1, §8.2, §5.3

**InvestorProfile shape (from `investor_profiles` table):**
```typescript
interface InvestorProfile {
  id: string;
  search_id: string;
  canonical_name: string;
  fund_name: string | null;
  website: string | null;
  sectors: string[] | null;
  stages: string[] | null;
  geo_focus: string[] | null;
  check_min: number | null;
  check_max: number | null;
  contact_email: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  fit_score: number | null;
  sector_fit: number | null;
  stage_fit: number | null;
  budget_fit: number | null;
  geo_fit: number | null;
  fit_reasoning: string | null;
  rank_position: number | null;
}
```
Define this as `frontend/types/investor.ts`.

**What already exists:**
- `frontend/lib/api.ts` — `apiFetch` utility (from S4-001)
- `frontend/components/ui/button.tsx` — shadcn Button (from S4-001)
- `frontend/components/investors/` — empty directory

**Save endpoint:** `POST /api/v1/investors/{id}/save` — returns `{ id, user_id, investor_id, status, created_at }` or `409`-like if already saved (service returns existing). Treat any 2xx as "saved".

**What to build:**

### `frontend/types/investor.ts`
Define and export `InvestorProfile` interface as above.

### `frontend/components/investors/FitScoreBadge.tsx`
```typescript
'use client';
export function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const rounded = Math.round(score);
  const cls = score >= 80
    ? 'bg-green-100 text-green-800'
    : score >= 60
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {rounded}% fit
    </span>
  );
}
```

### `frontend/components/investors/InvestorCard.tsx`
- `'use client'` component
- Props: `investor: InvestorProfile`
- Local state: `saved: boolean`, `showBreakdown: boolean`, `showPitch: boolean`
- "Save" button: `useMutation` → `apiFetch` POST `/investors/${id}/save`; on success set `saved = true`
- "Generate Pitch" button: `onClick={() => setShowPitch(true)}`; renders `{showPitch && <div>PitchModal stub</div>}`
- "Fit Details" toggle: `onClick={() => setShowBreakdown(b => !b)}`; renders `{showBreakdown && <div>FitBreakdown stub</div>}`
- Sectors: render as small grey pills `sectors?.map(s => <span key={s}>{s}</span>)`

### shadcn/ui components to install
Run: `npx shadcn@latest add card badge` (optional — can use Tailwind divs)

## Tasks

- [x] Create `frontend/types/investor.ts` — `InvestorProfile` interface
- [x] Create `frontend/components/investors/FitScoreBadge.tsx` (AC: 1)
- [x] Create `frontend/components/investors/InvestorCard.tsx` (AC: 2–6)
- [x] Run `npm run typecheck && npm run lint` — zero errors

## File List
- `frontend/types/investor.ts` (new)
- `frontend/components/investors/FitScoreBadge.tsx` (new)
- `frontend/components/investors/InvestorCard.tsx` (new)

## Dev Agent Record

### Completion Notes
- `InvestorProfile` type defined in `frontend/types/investor.ts`
- `FitScoreBadge`: green/yellow/red pill based on score threshold; returns null for null score
- `InvestorCard`: Save mutation with loading/saved state; FitBreakdown and PitchModal stubs (replaced in S4-005/S4-006)
- No shadcn card/badge installed — used Tailwind divs to avoid extra CLI dependencies
- typecheck + lint: ✅ zero errors
