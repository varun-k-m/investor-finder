'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Linkedin, Twitter, ExternalLink, DollarSign } from 'lucide-react';
import type { InvestorProfile } from '@/types/investor';
import { FitScoreRing } from './FitScoreRing';
import { FitBreakdown } from './FitBreakdown';
import { FitReasoningBlock } from './FitReasoningBlock';
import { PitchModal } from './PitchModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiFetch } from '@/lib/api';
import { track } from '@/lib/posthog';
import { formatBudget, investorInitials, avatarColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { InvestorStatus } from '@/types/saved-investor';

const STATUS_LABELS: Record<InvestorStatus, string> = {
  saved: 'Saved ✓',
  contacted: 'Contacted ✓',
  replied: 'Replied ✓',
  passed: 'Passed',
};

const STATUS_COLORS: Record<InvestorStatus, string> = {
  saved:     'bg-green-600 text-white hover:bg-green-700 border-green-600',
  contacted: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
  replied:   'bg-purple-600 text-white hover:bg-purple-700 border-purple-600',
  passed:    'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
};

interface SaveResponse {
  id: string;
  investor_id: string;
  status: string;
}

export function InvestorCard({
  investor,
  initialStatus,
}: {
  investor: InvestorProfile;
  initialStatus?: InvestorStatus;
}) {
  const [saved, setSaved] = useState(!!initialStatus);
  const [savedStatus, setSavedStatus] = useState<InvestorStatus | undefined>(initialStatus);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [animating, setAnimating] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const { getToken } = useAuth();

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<SaveResponse>(`/investors/${investor.id}/save`, getToken, { method: 'POST' }),
    onSuccess: () => {
      setSaved(true);
      setSavedStatus('saved');
      if (!reducedMotion) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);
      }
      track('investor_saved', { investor_id: investor.id, investor_name: investor.canonical_name });
    },
  });

  const initials = investorInitials(investor.canonical_name);
  const bgColor = avatarColor(investor.canonical_name);

  const fitTooltip = [
    investor.sector_fit != null && `Sector: ${Math.round(investor.sector_fit)}`,
    investor.stage_fit != null && `Stage: ${Math.round(investor.stage_fit)}`,
    investor.budget_fit != null && `Budget: ${Math.round(investor.budget_fit)}`,
    investor.geo_fit != null && `Geo: ${Math.round(investor.geo_fit)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className={cn('text-white text-sm font-semibold', bgColor)}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight">
                {investor.canonical_name}
              </h3>
              {investor.fund_name && (
                <p className="text-sm text-muted-foreground truncate">{investor.fund_name}</p>
              )}
            </div>
          </div>

          {/* Fit score ring with tooltip */}
          {investor.fit_score !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-default">
                  <FitScoreRing score={investor.fit_score} />
                </div>
              </TooltipTrigger>
              {fitTooltip && (
                <TooltipContent side="left" className="text-xs">
                  {fitTooltip}
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>

        {/* Sector + stage tags */}
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
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {investor.check_min !== null && investor.check_max !== null && (
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatBudget(investor.check_min)} – {formatBudget(investor.check_max)}
            </span>
          )}
          {investor.geo_focus && investor.geo_focus.length > 0 && (
            <span>🌍 {investor.geo_focus.slice(0, 3).join(', ')}</span>
          )}
        </div>

        {/* Fit reasoning */}
        {investor.fit_reasoning && (
          <FitReasoningBlock reasoning={investor.fit_reasoning} />
        )}

        {/* Fit Details toggle */}
        <button
          type="button"
          onClick={() => setShowBreakdown((b) => !b)}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
        >
          {showBreakdown ? '▴ Hide' : '▾ Show'} Fit Details
        </button>

        <FitBreakdown investor={investor} open={showBreakdown} />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saved || saveMutation.isPending}
            animate={animating && !reducedMotion ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={cn(
              'inline-flex items-center justify-center rounded-md text-sm font-medium',
              'h-9 px-3 border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              saved && savedStatus
                ? STATUS_COLORS[savedStatus]
                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {saved && savedStatus
              ? STATUS_LABELS[savedStatus]
              : saveMutation.isPending
                ? 'Saving...'
                : 'Save'}
          </motion.button>

          <Button size="sm" variant="outline" onClick={() => setShowPitch(true)}>
            Generate Pitch
          </Button>

          {/* Social links */}
          <div className="flex items-center gap-1.5 ml-auto">
            {investor.linkedin_url && (
              <a
                href={investor.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#0A66C2] transition-colors"
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
    </TooltipProvider>
  );
}
