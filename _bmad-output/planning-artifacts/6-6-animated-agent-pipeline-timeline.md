# Story S6-006 — Animated Agent Pipeline Timeline

**Epic:** 6 — UI Enrichment  
**Points:** 3  
**Agent:** FE Dev  
**Depends on:** S6-001 (Framer Motion installed)

---

## Goal

Replace the simple spinner + progress bar in `AgentProgressBar` with an animated step-by-step pipeline timeline that shows each agent stage as a named node, animates the active stage, and gives the founder a clear sense of what the AI is doing at each moment.

---

## Acceptance Criteria

1. Four pipeline stages rendered as horizontal step nodes: Parse → Discover → Synthesise → Rank.
2. Completed stages show a filled green checkmark.
3. Active stage pulses with an animated ring (Framer Motion).
4. Pending stages are dimmed.
5. An optional log line beneath the active step shows the `message` from the SSE event.
6. The overall numeric percentage is still shown (small, to the right).
7. On `complete`, all steps transition to green checkmarks with a satisfying stagger animation.
8. `prefers-reduced-motion`: all animations disabled, show static state only.

---

## Stage Definitions

```typescript
const PIPELINE_STAGES = [
  { id: 'parsing',    label: 'Parse',      icon: Brain,      description: 'Analysing your idea' },
  { id: 'searching',  label: 'Discover',   icon: Search,     description: 'Searching investor networks' },
  { id: 'synthesis',  label: 'Synthesise', icon: Layers,     description: 'Merging & deduplicating results' },
  { id: 'complete',   label: 'Rank',       icon: BarChart2,  description: 'Scoring investor fit' },
] as const;
```

---

## Visual Design

```
  [✓ Parse] ──── [● Discover] ──── [○ Synthesise] ──── [○ Rank]
                  Searching Crunchbase...                        48%
```

- Node diameter: 40px
- Active node: pulsing outer ring (`animate-ping` equivalent via Framer Motion)
- Connector line: `bg-border`, fills to `bg-primary` as stages complete
- Stage label below each node (12px, muted)
- Active message below active node (11px, muted-foreground, italic)

---

## Implementation

```tsx
// components/search/AgentProgressBar.tsx

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export function AgentProgressBar() {
  const agentStage = useAppStore((s) => s.agentStage);
  const agentProgress = useAppStore((s) => s.agentProgress);
  const shouldReduceMotion = useReducedMotion();

  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === agentStage);

  return (
    <div className="space-y-4">
      {/* Stage nodes */}
      <div className="relative flex items-center justify-between">
        {/* Connector track */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
        <motion.div
          className="absolute top-5 left-5 h-0.5 bg-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0, currentIndex) / (PIPELINE_STAGES.length - 1) }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
        />

        {PIPELINE_STAGES.map((stage, i) => {
          const isDone = currentIndex > i || agentStage === 'complete';
          const isActive = currentIndex === i && agentStage !== 'complete';
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative flex flex-col items-center gap-2 z-10">
              <div className="relative">
                {/* Pulse ring for active */}
                {isActive && !shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  />
                )}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                  isDone && 'bg-primary border-primary text-primary-foreground',
                  isActive && 'bg-background border-primary text-primary',
                  !isDone && !isActive && 'bg-background border-border text-muted-foreground',
                )}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
              </div>
              <span className={cn(
                'text-xs font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active message + progress */}
      <AnimatePresence mode="wait">
        {agentStage && agentStage !== 'complete' && (
          <motion.div
            key={agentStage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <span className="italic">
              {PIPELINE_STAGES.find((s) => s.id === agentStage)?.description}...
            </span>
            <span>{Math.round(agentProgress ?? 0)}%</span>
          </motion.div>
        )}
        {agentStage === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-green-600 font-medium text-center"
          >
            Search complete — results ready below
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Files Changed

- `frontend/components/search/AgentProgressBar.tsx` — full rewrite
