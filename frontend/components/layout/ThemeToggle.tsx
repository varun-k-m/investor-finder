'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const current = (theme ?? 'system') as Theme;
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const Icon = ICONS[current];

  return (
    <TooltipProvider>
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
    </TooltipProvider>
  );
}
