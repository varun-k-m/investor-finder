'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Loader2, DollarSign, Linkedin, Twitter, ExternalLink } from 'lucide-react';
import type { SavedInvestor, InvestorStatus } from '@/types/saved-investor';
import { INVESTOR_STATUSES } from '@/types/saved-investor';
import { FitScoreBadge } from '@/components/investors/FitScoreBadge';
import { FitScoreRing } from '@/components/investors/FitScoreRing';
import { FitBreakdown } from '@/components/investors/FitBreakdown';
import { InvestorStatusPill } from './InvestorStatusPill';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { formatBudget, investorInitials, avatarColor } from '@/lib/format';
import { cn } from '@/lib/utils';

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

interface InvestorDetailModalProps {
  item: SavedInvestor | null;
  isUpdating: boolean;
  onClose: () => void;
  onStatusChange: (investorId: string, status: InvestorStatus) => void;
}

function InvestorDetailModal({ item, isUpdating, onClose, onStatusChange }: InvestorDetailModalProps) {
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (!item) return null;

  const { investor } = item;
  const initials = investorInitials(investor.canonical_name);
  const bgColor = avatarColor(investor.canonical_name);

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Avatar + name + fit score */}
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className={cn('text-white text-sm font-semibold', bgColor)}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-left leading-tight">
                  {investor.canonical_name}
                </DialogTitle>
                {investor.fund_name && (
                  <p className="text-sm text-muted-foreground">{investor.fund_name}</p>
                )}
              </div>
            </div>
            {investor.fit_score !== null && (
              <FitScoreRing score={investor.fit_score} />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Sectors + stages */}
          {((investor.sectors && investor.sectors.length > 0) ||
            (investor.stages && investor.stages.length > 0)) && (
            <div className="flex flex-wrap gap-1.5">
              {investor.sectors?.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
              {investor.stages?.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {/* Check range + geo */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {investor.check_min !== null && investor.check_max !== null && (
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatBudget(investor.check_min)} – {formatBudget(investor.check_max)}
              </span>
            )}
            {investor.geo_focus && investor.geo_focus.length > 0 && (
              <span>🌍 {investor.geo_focus.slice(0, 4).join(', ')}</span>
            )}
          </div>

          {/* Fit breakdown */}
          <div>
            <button
              type="button"
              onClick={() => setShowBreakdown((b) => !b)}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              {showBreakdown ? '▴ Hide' : '▾ Show'} Fit Details
            </button>
            <FitBreakdown investor={investor} open={showBreakdown} />
          </div>

          {/* Social links */}
          {(investor.linkedin_url || investor.twitter_url || investor.website) && (
            <div className="flex items-center gap-3">
              {investor.linkedin_url && (
                <a
                  href={investor.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {investor.twitter_url && (
                <a
                  href={investor.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {investor.website && (
                <a
                  href={investor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Website"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  className="w-full text-sm rounded border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                  value={item.status}
                  disabled={isUpdating}
                  onChange={(e) =>
                    onStatusChange(item.investor_id, e.target.value as InvestorStatus)
                  }
                >
                  {INVESTOR_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {COLUMN_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              {isUpdating && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SavedBoard() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<SavedInvestor | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    onMutate: ({ investorId }) => {
      setUpdatingId(investorId);
    },
    onSettled: () => {
      setUpdatingId(null);
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
    onSuccess: (_, { investorId, status }) => {
      // Optimistically update selectedItem status so the modal reflects the change
      setSelectedItem((prev) =>
        prev && prev.investor_id === investorId ? { ...prev, status } : prev,
      );
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
    <>
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
                  column.map((item) => {
                    const isUpdating = updatingId === item.investor_id;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-card p-3 space-y-2 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                        onClick={() => setSelectedItem(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-medium text-sm leading-tight truncate">
                              {item.investor.canonical_name}
                            </p>
                            {item.investor.fund_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.investor.fund_name}
                              </p>
                            )}
                          </div>
                          <FitScoreBadge score={item.investor.fit_score} />
                        </div>

                        <InvestorStatusPill status={item.status} />

                        {/* Status dropdown inline on card */}
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                            value={item.status}
                            disabled={isUpdating}
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
                          {isUpdating && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <InvestorDetailModal
        item={selectedItem}
        isUpdating={updatingId === selectedItem?.investor_id}
        onClose={() => setSelectedItem(null)}
        onStatusChange={(investorId, status) =>
          statusMutation.mutate({ investorId, status })
        }
      />
    </>
  );
}
