'use client';

import { Slider } from '@/components/ui/slider';
import { formatBudget } from '@/lib/format';

// Logarithmic-like snap points that match how investors talk about check sizes
const SNAP_POINTS = [0, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];
const MAX_IDX = SNAP_POINTS.length - 1;
export const BUDGET_UNLIMITED = SNAP_POINTS[MAX_IDX]; // 10_000_000 — sentinel for "no cap"

function dollarToIndex(v: number): number {
  // Find the index of the closest snap point
  let closest = 0;
  let minDiff = Math.abs(SNAP_POINTS[0] - v);
  for (let i = 1; i < SNAP_POINTS.length; i++) {
    const diff = Math.abs(SNAP_POINTS[i] - v);
    if (diff < minDiff) { minDiff = diff; closest = i; }
  }
  return closest;
}

function rangeLabel(min: number, max: number): string {
  if (min === 0 && max === BUDGET_UNLIMITED) return 'Any check size';
  if (min === 0) return `Up to ${formatBudget(max)}`;
  if (max === BUDGET_UNLIMITED) return `${formatBudget(min)}+`;
  return `${formatBudget(min)} – ${formatBudget(max)}`;
}

// Tick labels shown below the slider at key indices
const TICKS: { idx: number; label: string }[] = [
  { idx: 0, label: '$0' },
  { idx: 3, label: '$250K' },
  { idx: 5, label: '$1M' },
  { idx: 7, label: '$5M' },
  { idx: 8, label: '$10M+' },
];

interface BudgetSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function BudgetSlider({ value, onChange }: BudgetSliderProps) {
  const minIdx = dollarToIndex(value[0]);
  const maxIdx = dollarToIndex(value[1]);
  const isAny = value[0] === 0 && value[1] === BUDGET_UNLIMITED;

  const handleChange = (indices: number[]) => {
    onChange([SNAP_POINTS[indices[0]], SNAP_POINTS[indices[1]]]);
  };

  return (
    <div className="space-y-3">
      {/* Current range label + reset */}
      <div className="flex items-center justify-between min-h-[20px]">
        <span className={`text-sm font-medium ${isAny ? 'text-muted-foreground' : 'text-foreground'}`}>
          {rangeLabel(value[0], value[1])}
        </span>
        {!isAny && (
          <button
            type="button"
            onClick={() => onChange([0, BUDGET_UNLIMITED])}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Range slider (index-based, snaps to meaningful values) */}
      <Slider
        min={0}
        max={MAX_IDX}
        step={1}
        value={[minIdx, maxIdx]}
        onValueChange={handleChange}
        className="w-full"
      />

      {/* Tick labels */}
      <div className="relative h-4">
        {TICKS.map(({ idx, label }) => (
          <span
            key={idx}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            style={{ left: `${(idx / MAX_IDX) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
