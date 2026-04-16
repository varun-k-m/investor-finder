'use client';

import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface MilestoneCardProps {
  used: number;
  limit: number;
  onUpgrade?: () => void;
  className?: string;
}

export function MilestoneCard({ used, limit, onUpgrade, className }: MilestoneCardProps) {
  const router = useRouter();
  const pct = Math.min((used / limit) * 100, 100);

  function handleUpgrade() {
    onUpgrade?.();
    router.push('/pricing');
  }

  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3',
        className,
      )}
    >
      {/* Icon + title row */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <p className="font-semibold text-sm text-foreground">
          {used} search{used !== 1 ? 'es' : ''} completed this month
        </p>
      </div>

      {/* Body copy */}
      <p className="text-sm text-muted-foreground">
        You&apos;ve explored {used} investor pool{used !== 1 ? 's' : ''}. Upgrade to Pro for
        unlimited searches and keep the momentum going.
      </p>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${used} of ${limit} free searches used`}
        className="h-2 w-full rounded-full bg-primary/15 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button onClick={handleUpgrade} className="w-full">
          Upgrade to Pro ✨
        </Button>
        <Link
          href="/pricing"
          className="text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          View pricing
        </Link>
      </div>
    </div>
  );
}
