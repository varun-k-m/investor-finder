'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { InvestorProfile } from '@/types/investor';
import { FitScoreBadge } from './FitScoreBadge';
import { FitBreakdown } from './FitBreakdown';
import { PitchModal } from './PitchModal';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { track } from '@/lib/posthog';

interface SaveResponse {
  id: string;
  investor_id: string;
  status: string;
}

export function InvestorCard({ investor }: { investor: InvestorProfile }) {
  const [saved, setSaved] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const { getToken } = useAuth();

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<SaveResponse>(`/investors/${investor.id}/save`, getToken, {
        method: 'POST',
      }),
    onSuccess: () => {
      setSaved(true);
      track('investor_saved', { investor_id: investor.id, investor_name: investor.canonical_name });
    },
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-base leading-tight">{investor.canonical_name}</h3>
          {investor.fund_name && (
            <p className="text-sm text-muted-foreground">{investor.fund_name}</p>
          )}
        </div>
        <FitScoreBadge score={investor.fit_score} />
      </div>

      {/* Sector tags */}
      {investor.sectors && investor.sectors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {investor.sectors.map((s) => (
            <span
              key={s}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Fit Details toggle */}
      <button
        type="button"
        onClick={() => setShowBreakdown((b) => !b)}
        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        {showBreakdown ? 'Hide' : 'Show'} Fit Details
      </button>

      <FitBreakdown investor={investor} open={showBreakdown} />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => saveMutation.mutate()}
          disabled={saved || saveMutation.isPending}
        >
          {saved ? 'Saved' : saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>

        <Button size="sm" variant="outline" onClick={() => setShowPitch(true)}>
          Generate Pitch
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-xs text-destructive">
          {(saveMutation.error as Error).message}
        </p>
      )}

      <PitchModal
        investorId={investor.id}
        investorName={investor.canonical_name}
        open={showPitch}
        onClose={() => setShowPitch(false)}
      />
    </div>
  );
}
