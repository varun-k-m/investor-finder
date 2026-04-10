'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
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

  const { data } = useQuery({
    queryKey: ['search', id],
    queryFn: () => apiFetch<SearchResult>(`/searches/${id}`, getToken),
    refetchInterval: (query) =>
      query.state.data?.status === 'complete' || query.state.data?.status === 'failed'
        ? false
        : 2000,
  });

  useAgentStream(
    data?.status === 'pending' || data?.status === 'running' ? id : null,
  );

  const isRunning = !data || data.status === 'pending' || data.status === 'running';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Search Results</h1>
      <p className="text-muted-foreground text-sm mb-6">Search ID: {id}</p>

      {isRunning && (
        <div className="mb-8">
          <AgentProgressBar />
        </div>
      )}

      {data?.status === 'complete' && <InvestorGrid searchId={id} />}

      {data?.status === 'failed' && (
        <div className="text-destructive text-sm">
          Search failed. Please try again.
        </div>
      )}
    </div>
  );
}
