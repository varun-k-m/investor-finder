'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { SavedInvestor, InvestorStatus } from '@/types/saved-investor';
import { INVESTOR_STATUSES } from '@/types/saved-investor';
import { FitScoreBadge } from '@/components/investors/FitScoreBadge';
import { InvestorStatusPill } from './InvestorStatusPill';
import { apiFetch } from '@/lib/api';

const COLUMN_LABELS: Record<InvestorStatus, string> = {
  saved: 'Saved',
  contacted: 'Contacted',
  replied: 'Replied',
  passed: 'Passed',
};

function SkeletonColumn() {
  return (
    <div className="flex-1 min-w-[200px] space-y-3">
      <div className="animate-pulse bg-muted rounded h-6 w-24 mb-4" />
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
      ))}
    </div>
  );
}

export function SavedBoard() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ['saved'],
    queryFn: () => apiFetch<SavedInvestor[]>('/users/me/saved', getToken),
  });

  const statusMutation = useMutation({
    mutationFn: ({ investorId, status }: { investorId: string; status: InvestorStatus }) =>
      apiFetch(`/investors/${investorId}/status`, getToken, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  if (isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {INVESTOR_STATUSES.map((s) => (
          <SkeletonColumn key={s} />
        ))}
      </div>
    );
  }

  const items = data ?? [];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {INVESTOR_STATUSES.map((status) => {
        const column = items.filter((i) => i.status === status);
        return (
          <div key={status} className="flex-1 min-w-[220px]">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              {COLUMN_LABELS[status]}
              <span className="text-muted-foreground text-xs">({column.length})</span>
            </h3>

            <div className="space-y-2">
              {column.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  No investors here yet
                </p>
              ) : (
                column.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="font-medium text-sm leading-tight">
                          {item.investor.canonical_name}
                        </p>
                        {item.investor.fund_name && (
                          <p className="text-xs text-muted-foreground">{item.investor.fund_name}</p>
                        )}
                      </div>
                      <FitScoreBadge score={item.investor.fit_score} />
                    </div>

                    <InvestorStatusPill status={item.status} />

                    <select
                      className="w-full text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      value={item.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          investorId: item.investor_id,
                          status: e.target.value as InvestorStatus,
                        })
                      }
                    >
                      {INVESTOR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {COLUMN_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
