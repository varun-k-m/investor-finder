# Story S6-005 — Enhanced Dashboard

**Epic:** 6 — UI Enrichment  
**Points:** 2  
**Agent:** FE Dev  
**Depends on:** S6-001 (Skeleton, Badge)

---

## Goal

Upgrade `app/(app)/dashboard/page.tsx` with a stats bar showing key usage metrics, richer search history cards with more context, and an illustrated empty state that encourages the first search.

---

## Acceptance Criteria

1. Stats bar shows three counters: total searches, investors found (sum of `result_count`), and saved investors count.
2. Stats bar skeletons correctly while data loads.
3. Search history cards show: truncated idea text, status badge, investor count, date, and (if complete) top sector tags.
4. Status badge colours: pending/running = amber, complete = green, failed = red.
5. Empty state shows a centred illustration placeholder, headline, sub-copy, and "Start Your First Search" CTA.
6. Pro upgrade banner (existing) remains.
7. Dark mode: all colours from design tokens.

---

## Stats Bar

Three `<StatCard>` components in a 3-col grid above the search list:

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Total Searches│  │Investors Found │  │  Saved         │
│      12        │  │     148        │  │     23         │
└────────────────┘  └────────────────┘  └────────────────┘
```

`StatCard` props: `label`, `value`, `icon` (lucide), `isLoading`.

Data sources:
- Total searches: `data.length` from existing `/searches` query
- Investors found: `data.reduce((acc, s) => acc + s.result_count, 0)`
- Saved investors: new query to `GET /users/me/saved` (count only, add `?count=true` or use existing endpoint response length)

### Loading state

Show `<Skeleton className="h-16 rounded-lg" />` for each stat card while `isPending`.

---

## Search History Cards

Enhanced card content:

```tsx
<div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3">
  {/* Status badge + date */}
  <div className="flex items-center justify-between">
    <StatusBadge status={search.status} />
    <span className="text-xs text-muted-foreground">
      {new Date(search.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  </div>

  {/* Idea text */}
  <p className="text-sm leading-snug line-clamp-2">{search.raw_input}</p>

  {/* Footer: investor count + quick link */}
  {search.status === 'complete' && (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{search.result_count} investors found</span>
      <span className="text-primary font-medium">View results →</span>
    </div>
  )}
  {search.status === 'running' && (
    <div className="flex items-center gap-1.5 text-xs text-amber-600">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Search in progress...</span>
    </div>
  )}
</div>
```

---

## Empty State

```tsx
<div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
  {/* SVG illustration placeholder — a simple magnifying-glass + chart icon */}
  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
    <Search className="h-10 w-10 text-primary/60" />
  </div>
  <div className="space-y-2">
    <h2 className="text-xl font-semibold">Find your first investors</h2>
    <p className="text-muted-foreground text-sm max-w-xs">
      Describe your startup and our AI will search the global investor network in real time.
    </p>
  </div>
  <Button asChild size="lg">
    <Link href="/search">Start Your First Search</Link>
  </Button>
</div>
```

---

## Files Changed

- `frontend/app/(app)/dashboard/page.tsx` — full rewrite
- `frontend/components/dashboard/StatCard.tsx` (new)
