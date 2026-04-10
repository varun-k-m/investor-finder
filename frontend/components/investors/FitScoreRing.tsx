'use client';

import { cn } from '@/lib/utils';

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FitScoreRingProps {
  score: number | null;
}

export function FitScoreRing({ score }: FitScoreRingProps) {
  if (score === null) return null;

  const rounded = Math.round(score);
  const strokeDashoffset = CIRCUMFERENCE * (1 - rounded / 100);
  const color =
    rounded >= 70
      ? 'text-green-500'
      : rounded >= 40
        ? 'text-amber-500'
        : 'text-red-400';

  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted/40"
        />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-500', color)}
        />
      </svg>
      <span className={cn('absolute text-[11px] font-bold rotate-0', color)}>
        {rounded}
      </span>
    </div>
  );
}
