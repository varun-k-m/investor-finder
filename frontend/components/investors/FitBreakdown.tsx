'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { InvestorProfile } from '@/types/investor';

interface Props {
  investor: InvestorProfile;
  open: boolean;
}

const DIMENSIONS = [
  { key: 'sector_fit', label: 'Sector Fit' },
  { key: 'stage_fit', label: 'Stage Fit' },
  { key: 'budget_fit', label: 'Budget Fit' },
  { key: 'geo_fit', label: 'Geography Fit' },
] as const;

function barColour(score: number) {
  return score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
}

export function FitBreakdown({ investor, open }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="pt-3 space-y-2">
            {DIMENSIONS.map(({ key, label }) => {
              const score = investor[key];
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-28 text-muted-foreground">{label}</span>
                  {score !== null ? (
                    <>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${barColour(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="w-10 text-right">{Math.round(score)}%</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
