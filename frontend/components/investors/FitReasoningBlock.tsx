import { cn } from '@/lib/utils';

export interface FitReasoningBlockProps {
  reasoning: string;
  className?: string;
}

export function FitReasoningBlock({ reasoning, className }: FitReasoningBlockProps) {
  return (
    <div className={cn('border-l-2 border-primary/30 bg-primary/5 pl-3 pr-2 py-2 rounded-r-md', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">
        Why this match
      </p>
      <p className="text-[13px] italic text-muted-foreground leading-snug">
        {reasoning}
      </p>
    </div>
  );
}
