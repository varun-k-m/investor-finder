import { cn } from '@/lib/utils';

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function PlanBadge({ plan }: { plan?: string }) {
  if (!plan) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        PLAN_STYLES[plan] ?? PLAN_STYLES.free,
      )}
    >
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}
