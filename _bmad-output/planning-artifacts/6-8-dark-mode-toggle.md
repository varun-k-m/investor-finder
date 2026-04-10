# Story S6-008 — Dark Mode Toggle

**Epic:** 6 — UI Enrichment  
**Points:** 2  
**Agent:** FE Dev  
**Depends on:** S6-001 (next-themes `ThemeProvider` wired into `app/layout.tsx`, `darkMode: 'class'` in Tailwind)

---

## Goal

Build a `ThemeToggle` component that cycles between light, dark, and system themes. Place it in the sidebar footer (consumed by S6-007). Ensure no flash of unstyled content (FOUC) on load and that the preference persists across sessions.

---

## Acceptance Criteria

1. `ThemeToggle` renders a button that cycles: system → light → dark → system.
2. The icon updates to match the active theme (Monitor / Sun / Moon from lucide).
3. Theme persists in `localStorage` via `next-themes` (no extra code needed).
4. No white flash on dark-mode page load (handled by `next-themes` `suppressHydrationWarning`).
5. All existing pages look correct in both light and dark mode — no hardcoded `bg-white` or `text-black` values remain.
6. `prefers-color-scheme: dark` is honoured when the user hasn't made an explicit choice.

---

## Implementation

### `ThemeToggle` component

```tsx
// components/layout/ThemeToggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const THEMES = ['system', 'light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

const ICONS: Record<Theme, React.ElementType> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Theme, string> = {
  system: 'System theme',
  light: 'Light mode',
  dark: 'Dark mode',
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render nothing until mounted
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const current = (theme ?? 'system') as Theme;
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const Icon = ICONS[current];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(next)}
          aria-label={LABELS[current]}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{LABELS[current]}</TooltipContent>
    </Tooltip>
  );
}
```

### `app/layout.tsx` update

Ensure `<html>` has `suppressHydrationWarning` (required by next-themes to silence the attribute mismatch):

```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  </body>
</html>
```

`disableTransitionOnChange` prevents a colour-transition flash when switching themes.

---

## Dark Mode Audit

Scan all existing components for hardcoded colours that break dark mode. Common culprits:

| Pattern to find | Replace with |
|---|---|
| `bg-white` | `bg-background` |
| `text-black` | `text-foreground` |
| `bg-gray-50` / `bg-gray-100` | `bg-muted` |
| `text-gray-500` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `bg-green-50 border-green-200` | Keep (semantic success colour — acceptable) |
| `bg-amber-50 border-amber-200` | Keep (semantic warning colour — acceptable) |

Check: `app/(app)/dashboard/page.tsx`, `components/investors/*.tsx`, `app/(app)/layout.tsx`.

---

## Files Changed / Created

- `frontend/components/layout/ThemeToggle.tsx` (new)
- `frontend/app/layout.tsx` — add `suppressHydrationWarning`
- Various existing components — replace hardcoded colour classes with tokens (audit pass)
