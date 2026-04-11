'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, Layers, BarChart2, Check, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AgentStage } from '@/store/app.store';

// Matches backend discovery.service.ts exactly:
//   searching @ 10%  →  synthesis @ 60%  →  ranking @ 80%  →  complete @ 100%
const PIPELINE_STAGES: {
  id: AgentStage;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { id: 'searching', label: 'Discover',   icon: Search,    description: 'Searching investor networks' },
  { id: 'synthesis', label: 'Synthesise', icon: Layers,    description: 'Merging & deduplicating results' },
  { id: 'ranking',   label: 'Rank',       icon: BarChart2, description: 'Scoring investor fit' },
];

export function AgentProgressBar() {
  const agentStage = useAppStore((s) => s.agentStage);
  const agentProgress = useAppStore((s) => s.agentProgress);
  const shouldReduceMotion = useReducedMotion();

  const isConnecting = agentStage === null;
  const isComplete = agentStage === 'complete';

  const currentIndex = isConnecting
    ? -1
    : isComplete
    ? PIPELINE_STAGES.length
    : PIPELINE_STAGES.findIndex((s) => s.id === agentStage);

  // Progress fraction along the connector line (clamped 0–1)
  const progressFraction = isConnecting
    ? 0
    : isComplete
    ? 1
    : Math.min(1, Math.max(0, currentIndex) / Math.max(1, PIPELINE_STAGES.length - 1));

  return (
    <div className="space-y-5">
      {/* Stage nodes + connector */}
      <div className="relative flex items-start justify-between">
        {/* Background connector track */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />

        {/* Filled connector */}
        <motion.div
          className="absolute top-5 left-5 h-0.5 bg-primary origin-left"
          style={{ right: '20px' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isComplete ? 1 : progressFraction }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
        />

        {PIPELINE_STAGES.map((stage, i) => {
          const isDone = isComplete || currentIndex > i;
          // When connecting, treat first stage as faintly active (waiting)
          const isActive = !isComplete && !isConnecting && currentIndex === i;
          const isWaiting = isConnecting && i === 0;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative flex flex-col items-center gap-2 z-10">
              <div className="relative">
                {/* Pulse ring for active stage */}
                {(isActive || isWaiting) && !shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: isWaiting ? 2.5 : 1.8 }}
                  />
                )}
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    isDone && 'bg-primary border-primary text-primary-foreground',
                    isActive && 'bg-background border-primary text-primary',
                    isWaiting && 'bg-background border-primary/50 text-primary/50',
                    !isDone && !isActive && !isWaiting && 'bg-background border-border text-muted-foreground',
                  )}
                  animate={isDone && !shouldReduceMotion ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </motion.div>
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  (isActive || isWaiting) ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {isConnecting && (
          <motion.div
            key="connecting"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            <span className="italic">Connecting to agent…</span>
          </motion.div>
        )}

        {!isConnecting && agentStage && !isComplete && (
          <motion.div
            key={agentStage}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -4 }}
            className="space-y-2"
          >
            {/* Stage label + progress */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {PIPELINE_STAGES.find((s) => s.id === agentStage)?.description}…
              </span>
              <span className="text-muted-foreground tabular-nums">
                {Math.round(agentProgress ?? 0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(agentProgress ?? 0)}%` }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        {isComplete && (
          <motion.div
            key="complete"
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium py-1"
          >
            <Check className="h-4 w-4" />
            Search complete — results ready below
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
