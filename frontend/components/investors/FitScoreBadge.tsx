'use client';

import { FitScoreRing } from './FitScoreRing';

// Kept for backwards compatibility — delegates to FitScoreRing
export function FitScoreBadge({ score, investorId }: { score: number | null; investorId: string }) {
  return <FitScoreRing score={score} investorId={investorId} />;
}
