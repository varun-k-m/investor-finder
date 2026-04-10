'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { InvestorProfile } from '@/types/investor';
import { InvestorCard } from './InvestorCard';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface InvestorsResponse {
  data: InvestorProfile[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

export function InvestorGrid({ searchId }: { searchId: string }) {
  const [page, setPage] = useState(1);
  const { getToken } = useAuth();

  const { data, isPending } = useQuery({
    queryKey: ['investors', searchId, page],
    queryFn: () =>
      apiFetch<InvestorsResponse>(
        `/searches/${searchId}/investors?page=${page}&limit=${LIMIT}`,
        getToken,
      ),
  });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-48" />
        ))}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No investors found yet.
      </div>
    );
  }

  const { data: investors, total } = data;
  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, total);
  const hasPrev = page > 1;
  const hasNext = page * LIMIT < total;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} investors
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {investors.map((investor) => (
          <InvestorCard key={investor.id} investor={investor} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p - 1)}
          disabled={!hasPrev}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
