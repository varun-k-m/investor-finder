'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Users, Bookmark, Loader2 } from 'lucide-react';
import type { SearchSummary } from '@/types/search';
import type { SavedInvestor } from '@/types/saved-investor';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';

const STATUS_BADGE_VARIANT: Record<SearchSummary['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  running: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABELS: Record<SearchSummary['status'], string> = {
  pending: 'Pending',
  running: 'Running',
  complete: 'Complete',
  failed: 'Failed',
};

function DashboardContent() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data, isPending } = useQuery({
    queryKey: ['searches'],
    queryFn: () => apiFetch<SearchSummary[]>('/searches', getToken),
  });

  const { data: savedData, isPending: savedPending } = useQuery({
    queryKey: ['saved-investors'],
    queryFn: () => apiFetch<SavedInvestor[]>('/users/me/saved', getToken),
  });

  const totalInvestors = data?.reduce((acc, s) => acc + (s.result_count ?? 0), 0) ?? 0;
  const savedCount = savedData?.length ?? 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Upgrade banner */}
      {searchParams.get('upgraded') === 'true' && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-green-800 dark:text-green-300 text-sm flex items-center justify-between">
          <span>Welcome to Pro! Unlimited searches unlocked. 🎉</span>
          <button
            onClick={() => router.replace('/dashboard')}
            className="ml-4 font-bold hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button asChild>
          <Link href="/search">New Search</Link>
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total searches"
          value={data?.length ?? 0}
          icon={SearchIcon}
          isLoading={isPending}
        />
        <StatCard
          label="Investors found"
          value={totalInvestors}
          icon={Users}
          isLoading={isPending}
        />
        <StatCard
          label="Saved investors"
          value={savedCount}
          icon={Bookmark}
          isLoading={savedPending}
        />
      </div>

      {/* Search history */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-28" />
          ))}
        </div>
      )}

      {!isPending && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <SearchIcon className="h-10 w-10 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Find your first investors</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Describe your startup and our AI will search the global investor network in real time.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/search">Start Your First Search</Link>
          </Button>
        </div>
      )}

      {!isPending && data && data.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Recent searches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 -mt-4">
            {data.map((search) => (
              <Link
                key={search.id}
                href={`/search/${search.id}`}
                className="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
              >
                {/* Status + date */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_VARIANT[search.status]}`}
                  >
                    {STATUS_LABELS[search.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(search.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Idea text */}
                <p className="text-sm leading-snug line-clamp-2 text-foreground">
                  {search.raw_input}
                </p>

                {/* Footer */}
                {search.status === 'complete' && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{search.result_count} investors found</span>
                    <span className="text-primary font-medium">View results →</span>
                  </div>
                )}
                {search.status === 'running' && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Search in progress...</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
