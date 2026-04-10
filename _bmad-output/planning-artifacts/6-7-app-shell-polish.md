# Story S6-007 — App Shell Polish

**Epic:** 6 — UI Enrichment  
**Points:** 3  
**Agent:** FE Dev  
**Depends on:** S6-001 (Avatar), S6-008 (ThemeToggle — can be developed in parallel)

---

## Goal

Polish the app shell (`app/(app)/layout.tsx`) with lucide icons on nav items, a user avatar + name in the sidebar footer, a plan badge, a mobile-responsive collapsible sidebar, and a top bar for narrow viewports.

---

## Acceptance Criteria

1. Each nav link has a matching lucide icon left of the label.
2. Sidebar footer shows the Clerk user's avatar (initials fallback), display name, and plan badge.
3. On mobile (< 768px), sidebar is hidden by default with a hamburger toggle in a top bar.
4. Mobile nav opens as a slide-in drawer (Framer Motion).
5. Active nav item uses a left-border accent instead of filled bg (visual refinement).
6. `ThemeToggle` is placed in the sidebar footer (Story S6-008 provides the component).
7. Usage progress bar (free plan) remains, styled to match the updated design.
8. Dark mode: all sidebar elements use design tokens.

---

## Nav Icon Mapping

```typescript
import { LayoutDashboard, Search, Bookmark, Settings } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Search', href: '/search',    icon: Search },
  { label: 'Saved',      href: '/saved',     icon: Bookmark },
  { label: 'Settings',   href: '/settings',  icon: Settings },
];
```

### Nav Item Styling (updated)

```tsx
<Link className={cn(
  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
  active
    ? 'border-l-2 border-primary bg-primary/5 text-primary pl-[10px]'
    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border-l-2 border-transparent',
)}>
  <Icon className="h-4 w-4 shrink-0" />
  {label}
</Link>
```

---

## Sidebar Footer (User Section)

```tsx
<div className="px-3 pb-4 space-y-3 border-t border-border pt-3">
  {/* User row */}
  <div className="flex items-center gap-2.5">
    <Avatar className="h-7 w-7">
      <AvatarImage src={clerkUser?.imageUrl} />
      <AvatarFallback className="text-xs">
        {clerkUser?.firstName?.[0]}{clerkUser?.lastName?.[0]}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate">
        {clerkUser?.fullName ?? meData?.email}
      </p>
      <PlanBadge plan={meData?.plan} />
    </div>
    <ThemeToggle />
  </div>

  {/* Usage bar — free plan only */}
  {meData?.plan === 'free' && <UsageBar used={meData.searches_this_month} limit={3} />}

  {/* Upgrade CTA — free plan only */}
  {meData?.plan === 'free' && (
    <Link href="/pricing" className="...">Upgrade to Pro ✨</Link>
  )}
</div>
```

### `PlanBadge`

```tsx
const PLAN_STYLES = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  enterprise: 'bg-purple-100 text-purple-700',
};
```

---

## Mobile Responsive Layout

### Top bar (mobile only, `md:hidden`)

```tsx
<header className="md:hidden fixed top-0 inset-x-0 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 z-40">
  <span className="font-semibold text-sm">InvestorMatch</span>
  <button onClick={() => setMobileOpen(true)}>
    <Menu className="h-5 w-5" />
  </button>
</header>
```

### Slide-in Drawer (Framer Motion)

```tsx
<AnimatePresence>
  {mobileOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setMobileOpen(false)}
      />
      {/* Drawer */}
      <motion.aside
        className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 md:hidden flex flex-col"
        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Same nav content as desktop sidebar */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

Desktop sidebar unchanged at `md:flex`.

Main content: `ml-0 md:ml-56`, add `pt-14 md:pt-0` for mobile top bar offset.

---

## Files Changed

- `frontend/app/(app)/layout.tsx` — full rewrite
- `frontend/components/layout/PlanBadge.tsx` (new)
- `frontend/components/layout/UsageBar.tsx` (new, extracted from layout)
