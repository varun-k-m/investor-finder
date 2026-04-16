'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

const MOCK_INVESTORS = [
  {
    initials: 'AC',
    name: 'Accel Partners',
    sectors: ['B2B SaaS', 'Dev Tools'],
    stage: 'Seed · Series A',
    checkMin: 500,
    checkMax: 5000,
    fitScore: 94,
    ringColor: 'stroke-emerald-500',
    scoreColor: 'text-emerald-600 dark:text-emerald-400',
    avatarGradient: 'from-blue-500 to-indigo-600',
  },
  {
    initials: 'BV',
    name: 'Bessemer Venture',
    sectors: ['SaaS', 'Cloud'],
    stage: 'Seed · Series A',
    checkMin: 1000,
    checkMax: 8000,
    fitScore: 88,
    ringColor: 'stroke-blue-500',
    scoreColor: 'text-blue-600 dark:text-blue-400',
    avatarGradient: 'from-violet-500 to-purple-600',
  },
  {
    initials: 'FR',
    name: 'First Round Capital',
    sectors: ['B2B', 'Consumer'],
    stage: 'Pre-seed · Seed',
    checkMin: 250,
    checkMax: 2000,
    fitScore: 81,
    ringColor: 'stroke-violet-500',
    scoreColor: 'text-violet-600 dark:text-violet-400',
    avatarGradient: 'from-emerald-500 to-teal-600',
  },
];

function formatK(val: number) {
  return val >= 1000 ? `$${val / 1000}M` : `$${val}K`;
}

function ScoreRing({
  score,
  ringColor,
  scoreColor,
  delay = 0,
  enabled,
}: {
  score: number;
  ringColor: string;
  scoreColor: string;
  delay?: number;
  enabled: boolean;
}) {
  const r = 16;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="40" height="40">
        <circle
          cx="20"
          cy="20"
          r={r}
          strokeWidth="2.5"
          className="stroke-muted"
          fill="none"
        />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          strokeWidth="2.5"
          className={ringColor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={
            enabled
              ? { strokeDashoffset: circumference - (score / 100) * circumference }
              : { strokeDashoffset: circumference }
          }
          transition={{ duration: 0.9, ease: 'easeOut', delay }}
        />
      </svg>
      <span className={`text-[10px] font-bold tabular-nums ${scoreColor}`}>
        {score}
      </span>
    </div>
  );
}

export function InvestorPreviewWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className="relative mt-14 w-full max-w-2xl mx-auto"
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
    >
      {/* Glow under the window */}
      <div className="absolute -inset-x-6 -bottom-4 top-8 bg-primary/8 rounded-3xl blur-3xl pointer-events-none" />

      {/* Subtle float animation wraps the chrome */}
      <motion.div
        animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Browser chrome */}
        <div className="relative rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-2xl overflow-hidden">

          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 mx-2 rounded-md bg-background/60 border border-border/60 px-3 py-1 text-[11px] text-muted-foreground font-mono tracking-tight truncate">
              app.investormatch.ai/search/b2b-saas-logistics
            </div>
            <span className="shrink-0 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              14 matches · 43s
            </span>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="w-4 text-center">#</span>
            <span className="w-9 shrink-0" />
            <span className="flex-1">Investor</span>
            <span className="hidden sm:block w-28 text-right">Check Size</span>
            <span className="w-10 text-center">Fit</span>
          </div>

          {/* Investor rows */}
          <div className="divide-y divide-border">
            {MOCK_INVESTORS.map((inv, i) => (
              <motion.div
                key={inv.name}
                className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors duration-150 cursor-default group"
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.3 + i * 0.13, ease: 'easeOut' }}
              >
                {/* Rank */}
                <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">
                  {i + 1}
                </span>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${inv.avatarGradient} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm`}
                >
                  {inv.initials}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold leading-tight">{inv.name}</span>
                    <span className="hidden sm:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                      {inv.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {inv.sectors.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Check size */}
                <div className="hidden sm:flex items-center gap-0.5 w-28 justify-end text-xs text-muted-foreground shrink-0">
                  <DollarSign className="h-3 w-3" />
                  {formatK(inv.checkMin)} – {formatK(inv.checkMax)}
                </div>

                {/* Score ring */}
                <ScoreRing
                  score={inv.fitScore}
                  ringColor={inv.ringColor}
                  scoreColor={inv.scoreColor}
                  delay={0.5 + i * 0.13}
                  enabled={inView}
                />
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground"
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <span>Showing top 3 of 14 matches</span>
            <span className="text-primary font-semibold cursor-pointer hover:underline">
              View all + generate pitches →
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
