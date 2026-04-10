# Story S6-004 — Rich InvestorCard

**Epic:** 6 — UI Enrichment  
**Points:** 3  
**Agent:** FE Dev  
**Depends on:** S6-001 (Avatar, Badge, Tooltip shadcn components)

---

## Goal

Enrich `InvestorCard` and `FitScoreBadge` with a richer visual design: circular fit score ring, logo avatar fallback, check range chip, and clickable social links. The card should feel information-dense but scannable.

---

## Acceptance Criteria

1. Card shows a circular fit score ring (SVG arc) in place of or alongside the existing badge.
2. A logo avatar area shows investor initials as a coloured fallback (no external image fetch required).
3. Check range displayed as a formatted chip when both `check_min` and `check_max` are present.
4. LinkedIn and Twitter icons link out to `linkedin_url` / `twitter_url` when present (open in new tab).
5. Sector tags render as `<Badge variant="secondary">` chips.
6. Stage tags render as `<Badge variant="outline">` chips.
7. "Save" and "Generate Pitch" actions remain functional.
8. Card is keyboard-navigable; all interactive elements have visible focus rings.
9. Dark mode: all colours come from design system tokens.

---

## Visual Layout

```
┌─────────────────────────────────────────────────┐
│  [Avatar]  Sequoia Capital          [Fit Ring]  │
│            Global Growth Fund                   │
│                                                 │
│  [Fintech] [SaaS] [B2B]   [Seed] [Series A]    │
│                                                 │
│  💰 $500K – $5M   🌍 USA, Europe                │
│                                                 │
│  ▾ Show Fit Details                             │
│  ─────────────────────────────────────────────  │
│  [FitBreakdown if expanded]                     │
│                                                 │
│  [Save ✓]   [Generate Pitch]   [🔗] [🐦]        │
└─────────────────────────────────────────────────┘
```

---

## Component Details

### `FitScoreRing` (replace `FitScoreBadge`)

SVG circle arc showing percentage fill:

```tsx
// SVG circle approach
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const strokeDashoffset = CIRCUMFERENCE * (1 - score / 100);

// Colour: green >70, amber 40-70, red <40
const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-400';
```

Show score number in the centre of the ring.

### `InvestorAvatar`

Uses shadcn `<Avatar>`:
- `<AvatarFallback>` shows first 2 initials of `canonical_name` in a coloured background
- Colour derived from name hash (deterministic) — one of 6 preset bg colours

### Check Range Chip

```tsx
{investor.check_min !== null && investor.check_max !== null && (
  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
    <DollarSign className="h-3 w-3" />
    {formatBudget(investor.check_min)} – {formatBudget(investor.check_max)}
  </span>
)}
```

Use the same `formatBudget` helper from `BudgetSlider` (extract to `lib/format.ts`).

### Social Links

```tsx
<div className="flex items-center gap-2">
  {investor.linkedin_url && (
    <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer"
       className="text-muted-foreground hover:text-foreground transition-colors">
      <Linkedin className="h-4 w-4" />
    </a>
  )}
  {investor.twitter_url && (
    <a href={investor.twitter_url} target="_blank" rel="noopener noreferrer"
       className="text-muted-foreground hover:text-foreground transition-colors">
      <Twitter className="h-4 w-4" />
    </a>
  )}
  {investor.website && (
    <a href={investor.website} target="_blank" rel="noopener noreferrer"
       className="text-muted-foreground hover:text-foreground transition-colors">
      <ExternalLink className="h-4 w-4" />
    </a>
  )}
</div>
```

### Tooltip on Fit Ring

Wrap `FitScoreRing` in a `<Tooltip>` that shows:
```
Sector: 85 · Stage: 72 · Budget: 90 · Geo: 60
```

---

## Files Changed / Created

- `frontend/components/investors/InvestorCard.tsx` — full rewrite
- `frontend/components/investors/FitScoreRing.tsx` (new, replaces FitScoreBadge)
- `frontend/components/investors/FitScoreBadge.tsx` — keep for backwards compat, delegate to FitScoreRing
- `frontend/lib/format.ts` (new — `formatBudget`, `investorInitials`, `avatarColor`)
