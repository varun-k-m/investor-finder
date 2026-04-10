import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  isLoading?: boolean;
}

export function StatCard({ label, value, icon: Icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return <Skeleton className="h-20 rounded-lg" />;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
