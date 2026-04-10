'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Brain, Search, Layers, BarChart2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AgentStage } from '@/store/app.store';

const PIPELINE_STAGES: {
  id: AgentStage;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { id: 'parsing',   label: 'Parse',      icon: Brain,     description: 'Analysing your idea' },
  { id: 'searching', label: 'Discover',   icon: Search,    description: 'Searching investor networks' },
  { id: 'synthesis', label: 'Synthesise', icon: Layers,    description: 'Merging & deduplicating results' },
  { id: 'complete',  label: 'Rank',       icon: BarChart2, description: 'Scoring investor fit' },
];

export function AgentProgressBar() {
  const agentStage = useAppStore((s) => s.agentStage);
  const agentProgress = useAppStore((s) => s.agentProgress);
  const shouldReduceMotion = useReducedMotion();

  const isComplete = agentStage === 'complete';
  const currentIndex = isComplete
    ? PIPELINE_STAGES.length
    : PIPELINE_STAGES.findIndex((s) => s.id === agentStage);

  const progressFraction =
    PIPELINE_STAGES.length > 1
      ? Math.max(0, currentIndex) / (PIPELINE_STAGES.length - 1)
      : 0;

  return (
    <div className="space-y-4">
      {/* Stage nodes */}
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
          const isActive = !isComplete && currentIndex === i;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative flex flex-col items-center gap-2 z-10">
              <div className="relative">
                {/* Pulse ring for active stage */}
                {isActive && !shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  />
                )}
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    isDone && 'bg-primary border-primary text-primary-foreground',
                    isActive && 'bg-background border-primary text-primary',
                    !isDone && !isActive && 'bg-background border-border text-muted-foreground',
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
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active message + progress */}
      <AnimatePresence mode="wait">
        {agentStage && !isComplete && (
          <motion.div
            key={agentStage}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -4 }}
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <span className="italic">
              {PIPELINE_STAGES.find((s) => s.id === agentStage)?.description}...
            </span>
            <span>{Math.round(agentProgress ?? 0)}%</span>
          </motion.div>
        )}
        {isComplete && (
          <motion.div
            key="complete"
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-green-600 dark:text-green-400 font-medium text-center"
          >
            Search complete — results ready below
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
