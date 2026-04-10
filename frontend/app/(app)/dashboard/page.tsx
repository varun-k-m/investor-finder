'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { SearchSummary } from '@/types/search';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const STATUS_STYLES: Record<SearchSummary['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<SearchSummary['status'], string> = {
  pending: 'Pending',
  running: 'Running',
  complete: 'Complete',
  failed: 'Failed',
};

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export default function DashboardPage() {
  const { getToken } = useAuth();

  const { data, isPending } = useQuery({
    queryKey: ['searches'],
    queryFn: () => apiFetch<SearchSummary[]>('/searches', getToken),
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button asChild>
          <Link href="/search">New Search</Link>
        </Button>
      </div>

      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-28" />
          ))}
        </div>
      )}

      {!isPending && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
          <h2 className="text-xl font-medium">Start your first investor search</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Describe your startup idea and our AI will find the best-matched investors for you.
          </p>
          <Button asChild size="lg">
            <Link href="/search">Find Investors</Link>
          </Button>
        </div>
      )}

      {!isPending && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((search) => (
            <Link
              key={search.id}
              href={`/search/${search.id}`}
              className="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors space-y-2"
            >
              <p className="text-sm font-medium leading-snug">
                {truncate(search.raw_input, 120)}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[search.status]}`}
                >
                  {STATUS_LABELS[search.status]}
                </span>
                {search.status === 'complete' && (
                  <span>{search.result_count} investors</span>
                )}
                <span className="ml-auto">
                  {new Date(search.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
