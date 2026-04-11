'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAgentStream } from '@/hooks/useAgentStream';
import { AgentProgressBar } from '@/components/search/AgentProgressBar';
import { InvestorGrid } from '@/components/investors/InvestorGrid';

interface SearchResult {
  id: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  raw_input: string;
  result_count: number;
}

export default function SearchResultsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { getToken } = useAuth();

  const { data, isPending } = useQuery({
    queryKey: ['search', id],
    queryFn: () => apiFetch<SearchResult>(`/searches/${id}`, getToken),
    refetchInterval: (query) =>
      query.state.data?.status === 'complete' || query.state.data?.status === 'failed'
        ? false
        : 2000,
  });

  const isSearchRunning = data?.status === 'pending' || data?.status === 'running';

  // Connect SSE immediately (don't wait for HTTP poll to confirm 'running').
  // The stream endpoint handles already-complete searches gracefully, and
  // connecting early avoids missing the 'searching' event which fires right
  // after the worker starts — often before the first 2-second poll returns.
  const isAlreadyDone = data?.status === 'complete' || data?.status === 'failed';
  useAgentStream(!isAlreadyDone ? id : null);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard"
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">
            {isPending ? (
              <span className="inline-block animate-pulse bg-muted rounded h-6 w-48" />
            ) : (
              isSearchRunning ? 'Searching for investors…' : 'Search Results'
            )}
          </h1>
          {data?.raw_input && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{data.raw_input}</p>
          )}
        </div>
      </div>

      {/* Initial skeleton while fetching search metadata */}
      {isPending && (
        <div className="space-y-4">
          <div className="animate-pulse bg-muted rounded-lg h-24 w-full" />
        </div>
      )}

      {/* Progress bar — only when we have data and search is still running */}
      {!isPending && isSearchRunning && (
        <div className="rounded-lg border border-border bg-card p-6">
          <AgentProgressBar />
        </div>
      )}

      {/* Results */}
      {data?.status === 'complete' && <InvestorGrid searchId={id} />}

      {/* Error */}
      {data?.status === 'failed' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Search failed. Please try again from the dashboard.
        </div>
      )}
    </div>
  );
}
