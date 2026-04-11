'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Loader2, DollarSign, Linkedin, Twitter, ExternalLink, GripVertical } from 'lucide-react';
import type { SavedInvestor, InvestorStatus } from '@/types/saved-investor';
import type { SearchSummary } from '@/types/search';
import { INVESTOR_STATUSES } from '@/types/saved-investor';
import { FitScoreBadge } from '@/components/investors/FitScoreBadge';
import { FitScoreRing } from '@/components/investors/FitScoreRing';
import { FitBreakdown } from '@/components/investors/FitBreakdown';
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

const COLUMN_COLORS: Record<InvestorStatus, { header: string; active: string; pill: string }> = {
  saved:     { header: 'text-blue-600 dark:text-blue-400',     active: 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/30',     pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  contacted: { header: 'text-purple-600 dark:text-purple-400', active: 'border-purple-400 bg-purple-50/60 dark:bg-purple-950/30', pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  replied:   { header: 'text-green-600 dark:text-green-400',   active: 'border-green-400 bg-green-50/60 dark:bg-green-950/30',   pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  passed:    { header: 'text-gray-500 dark:text-gray-400',     active: 'border-gray-400 bg-gray-50/60 dark:bg-gray-800/30',     pill: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

function SkeletonColumn() {
  return (
    <div className="flex-1 min-w-[220px] space-y-3">
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

          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Move to</p>
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

  // Drag & drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFromStatus, setDraggedFromStatus] = useState<InvestorStatus | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<InvestorStatus | null>(null);
  // Counter per column to correctly handle dragenter/dragleave on child elements
  const dragCounters = useRef<Partial<Record<InvestorStatus, number>>>({});

  const { data, isPending } = useQuery({
    queryKey: ['saved'],
    queryFn: () => apiFetch<SavedInvestor[]>('/users/me/saved', getToken),
  });

  const { data: searchesData } = useQuery({
    queryKey: ['searches'],
    queryFn: () => apiFetch<SearchSummary[]>('/searches', getToken),
    staleTime: 5 * 60 * 1000,
  });

  const searchLabelById = new Map(
    searchesData?.map((s) => [
      s.id,
      s.raw_input.length > 40 ? s.raw_input.slice(0, 40).trimEnd() + '…' : s.raw_input,
    ]) ?? [],
  );

  const statusMutation = useMutation({
    mutationFn: ({ investorId, status }: { investorId: string; status: InvestorStatus }) =>
      apiFetch(`/investors/${investorId}/status`, getToken, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ investorId, status }) => {
      setUpdatingId(investorId);
      await queryClient.cancelQueries({ queryKey: ['saved'] });
      const previousData = queryClient.getQueryData<SavedInvestor[]>(['saved']);
      // Optimistic move — card appears in target column immediately
      queryClient.setQueryData<SavedInvestor[]>(['saved'], (old) =>
        old?.map((item) =>
          item.investor_id === investorId ? { ...item, status } : item,
        ) ?? [],
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['saved'], context.previousData);
      }
    },
    onSuccess: (_, { investorId, status }) => {
      setSelectedItem((prev) =>
        prev && prev.investor_id === investorId ? { ...prev, status } : prev,
      );
    },
    onSettled: () => {
      setUpdatingId(null);
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });

  const handleDrop = (targetStatus: InvestorStatus) => {
    if (draggedId && draggedFromStatus !== targetStatus) {
      statusMutation.mutate({ investorId: draggedId, status: targetStatus });
    }
    setDraggedId(null);
    setDraggedFromStatus(null);
    setDragOverStatus(null);
    dragCounters.current = {};
  };

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
  const isDragging = draggedId !== null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 items-start">
        {INVESTOR_STATUSES.map((status) => {
          const column = items.filter((i) => i.status === status);
          const isOver = dragOverStatus === status && draggedFromStatus !== status;
          const colors = COLUMN_COLORS[status];

          return (
            <div
              key={status}
              className={cn(
                'flex-1 min-w-[220px] rounded-xl border-2 p-3 transition-all duration-150',
                isOver
                  ? cn('border-dashed', colors.active)
                  : isDragging && draggedFromStatus !== status
                    ? 'border-dashed border-border/50 bg-muted/20'
                    : 'border-transparent bg-muted/40',
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => {
                dragCounters.current[status] = (dragCounters.current[status] ?? 0) + 1;
                if (draggedId) setDragOverStatus(status);
              }}
              onDragLeave={() => {
                const next = (dragCounters.current[status] ?? 1) - 1;
                dragCounters.current[status] = next;
                if (next <= 0) {
                  dragCounters.current[status] = 0;
                  setDragOverStatus((prev) => (prev === status ? null : prev));
                }
              }}
              onDrop={() => handleDrop(status)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h3 className={cn('font-semibold text-sm', colors.header)}>
                  {COLUMN_LABELS[status]}
                </h3>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors.pill)}>
                  {column.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {column.length === 0 ? (
                  <div
                    className={cn(
                      'rounded-lg border-2 border-dashed transition-all duration-150 flex items-center justify-center text-xs text-muted-foreground italic',
                      isOver ? 'h-20 border-current opacity-60' : 'h-14 border-border/40 opacity-40',
                    )}
                  >
                    {isOver ? 'Drop here' : 'No investors'}
                  </div>
                ) : (
                  <>
                    {column.map((item) => {
                      const isUpdating = updatingId === item.investor_id;
                      const isDragged = draggedId === item.investor_id;

                      return (
                        <div
                          key={item.id}
                          draggable
                          className={cn(
                            'rounded-lg border border-border bg-card p-3 space-y-1.5 select-none',
                            'cursor-grab active:cursor-grabbing',
                            'hover:border-primary/50 hover:shadow-sm transition-all',
                            isDragged && 'opacity-40 scale-[0.97] shadow-none',
                            isUpdating && 'opacity-60',
                          )}
                          onDragStart={(e) => {
                            setDraggedId(item.investor_id);
                            setDraggedFromStatus(item.status);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', item.investor_id);
                          }}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDraggedFromStatus(null);
                            setDragOverStatus(null);
                            dragCounters.current = {};
                          }}
                          onClick={() => {
                            if (!isDragging) setSelectedItem(item);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(item)}
                          aria-label={`${item.investor.canonical_name} — ${COLUMN_LABELS[status]}`}
                        >
                          <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/30" />
                            <div className="min-w-0 flex-1">
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
                                {isUpdating ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0 mt-0.5" />
                                ) : (
                                  <FitScoreBadge score={item.investor.fit_score} />
                                )}
                              </div>

                              {item.investor.sectors && item.investor.sectors.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {item.investor.sectors.slice(0, 2).join(' · ')}
                                </p>
                              )}
                              {searchLabelById.get(item.investor.search_id) && (
                                <p className="text-xs text-muted-foreground/60 truncate mt-1 italic">
                                  {searchLabelById.get(item.investor.search_id)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Extra drop target at bottom of non-empty column when dragging over */}
                    {isOver && (
                      <div className="h-10 rounded-lg border-2 border-dashed border-current opacity-30 flex items-center justify-center text-xs text-muted-foreground">
                        Drop here
                      </div>
                    )}
                  </>
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
