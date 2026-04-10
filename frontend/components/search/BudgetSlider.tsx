'use client';

import { Slider } from '@/components/ui/slider';
import { formatBudget } from '@/lib/format';

const MAX = 10_000_000;
const STEP = 50_000;

interface BudgetSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function label(min: number, max: number): string {
  if (min === 0 && max === 0) return 'Any amount';
  if (min === 0) return `Up to ${formatBudget(max)}`;
  if (max === MAX) return `${formatBudget(min)}+`;
  return `${formatBudget(min)} – ${formatBudget(max)}`;
}

export function BudgetSlider({ value, onChange }: BudgetSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Check size range</span>
        <span className="font-medium text-foreground">{label(value[0], value[1])}</span>
      </div>
      <Slider
        min={0}
        max={MAX}
        step={STEP}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>$0</span>
        <span>$10M+</span>
      </div>
    </div>
  );
}
