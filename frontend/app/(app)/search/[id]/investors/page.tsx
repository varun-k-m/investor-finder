'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { InvestorGrid } from '@/components/investors/InvestorGrid';

interface SearchResult {
  id: string;
  status: string;
  raw_input: string;
  result_count: number;
}

export default function InvestorListingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { getToken } = useAuth();

  const { data } = useQuery({
    queryKey: ['search', id],
    queryFn: () => apiFetch<SearchResult>(`/searches/${id}`, getToken),
  });

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
          <h1 className="text-xl font-semibold">Investor Results</h1>
          {data?.raw_input && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{data.raw_input}</p>
          )}
        </div>
        {data?.result_count != null && (
          <span className="shrink-0 text-sm text-muted-foreground self-start mt-1">
            {data.result_count} investors found
          </span>
        )}
      </div>

      <InvestorGrid searchId={id} />
    </div>
  );
}
