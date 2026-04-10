'use client';

import { FitScoreRing } from './FitScoreRing';

// Kept for backwards compatibility — delegates to FitScoreRing
export function FitScoreBadge({ score }: { score: number | null }) {
  return <FitScoreRing score={score} />;
}
