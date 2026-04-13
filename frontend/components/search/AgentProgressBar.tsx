'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Globe, Layers, BarChart2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AgentStage } from '@/store/app.store';

// ─── Stage config ──────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 'searching' as AgentStage,
    pill: 'Discover',
    fullLabel: 'Discovering investors',
    sublabel: 'Scanning VC databases, news feeds, and the web',
    Icon: Globe,
    iconColor: 'text-indigo-500',
    glow: 'rgba(99,102,241,0.45)',
    ring: 'rgba(99,102,241,0.18)',
    bg: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.13) 0%, transparent 72%)',
  },
  {
    id: 'synthesis' as AgentStage,
    pill: 'Synthesise',
    fullLabel: 'Synthesising results',
    sublabel: 'Merging and deduplicating investor profiles',
    Icon: Layers,
    iconColor: 'text-violet-500',
    glow: 'rgba(139,92,246,0.45)',
    ring: 'rgba(139,92,246,0.18)',
    bg: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.13) 0%, transparent 72%)',
  },
  {
    id: 'ranking' as AgentStage,
    pill: 'Rank',
    fullLabel: 'Ranking by fit',
    sublabel: 'Scoring each investor for your startup',
    Icon: BarChart2,
    iconColor: 'text-purple-500',
    glow: 'rgba(168,85,247,0.45)',
    ring: 'rgba(168,85,247,0.18)',
    bg: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.13) 0%, transparent 72%)',
  },
];

// ─── Shared helpers ────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

// ─── Pulse rings ───────────────────────────────────────────────────────────────

function PulseRings({ color }: { color: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: color }}
          animate={{ scale: [1, 1.9 + i * 0.3], opacity: [0.7, 0] }}
          transition={{ duration: 2.2, delay: i * 0.75, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

// ─── Searching visual ─────────────────────────────────────────────────────────
// Investor name tags floating at fixed positions around the edges.

const SEARCH_TAGS = [
  { name: 'Sequoia Capital',  x: '8%',  y: '10%', delay: 0 },
  { name: 'a16z',             x: '64%', y: '6%',  delay: 0.5 },
  { name: 'Y Combinator',     x: '76%', y: '26%', delay: 1.1 },
  { name: 'Accel',            x: '80%', y: '58%', delay: 0.3 },
  { name: 'Bessemer',         x: '60%', y: '80%', delay: 1.6 },
  { name: 'Lightspeed',       x: '22%', y: '82%', delay: 0.8 },
  { name: 'Tiger Global',     x: '4%',  y: '58%', delay: 1.3 },
  { name: 'Index Ventures',   x: '2%',  y: '28%', delay: 0.6 },
  { name: 'GV',               x: '38%', y: '2%',  delay: 1.9 },
  { name: 'First Round',      x: '40%', y: '88%', delay: 0.9 },
];

function SearchingVisual({ config, reduced }: { config: typeof STAGES[0]; reduced: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Floating investor tags */}
      {!reduced && SEARCH_TAGS.map((tag) => (
        <motion.div
          key={tag.name}
          className="absolute flex items-center bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-2.5 py-1 text-xs text-muted-foreground shadow-sm whitespace-nowrap"
          style={{ left: tag.x, top: tag.y }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: [0, 0.9, 0.55, 0.9], scale: [0.85, 1, 1, 1] }}
          transition={{ duration: 2.5, delay: tag.delay, repeat: Infinity, repeatDelay: 2 + tag.delay * 0.5, ease: 'easeOut' }}
        >
          {tag.name}
        </motion.div>
      ))}

      {/* Central orb */}
      <div className="relative flex items-center justify-center">
        {!reduced && <PulseRings color={config.ring} />}
        <motion.div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center bg-background border-2 shadow-xl"
          style={{ borderColor: config.glow }}
          animate={!reduced ? {
            boxShadow: [`0 0 18px ${config.glow}`, `0 0 38px ${config.glow}`, `0 0 18px ${config.glow}`],
          } : {}}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <config.Icon className={cn('h-7 w-7', config.iconColor)} />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Synthesis visual ──────────────────────────────────────────────────────────
// Dots orbit at varying radii then converge toward centre.

const SYNTH_DOTS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 2 * Math.PI;
  const r = 68 + (i % 3) * 18;
  return { x: r * Math.cos(angle), y: r * Math.sin(angle), delay: i * 0.12 };
});

function SynthesisVisual({ config, reduced }: { config: typeof STAGES[0]; reduced: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* Converging dots */}
        {!reduced && SYNTH_DOTS.map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.glow, left: '50%', top: '50%', marginLeft: -5, marginTop: -5 }}
            animate={{
              x: [dot.x, dot.x * 0.35, 0, dot.x * 0.35, dot.x],
              y: [dot.y, dot.y * 0.35, 0, dot.y * 0.35, dot.y],
              opacity: [0.5, 0.8, 1, 0.8, 0.5],
              scale:   [1, 1.2, 0.6, 1.2, 1],
            }}
            transition={{ duration: 3.2, delay: dot.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Central orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center bg-background border-2 shadow-xl z-10"
            style={{ borderColor: config.glow }}
            animate={!reduced ? {
              boxShadow: [`0 0 18px ${config.glow}`, `0 0 38px ${config.glow}`, `0 0 18px ${config.glow}`],
            } : {}}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <config.Icon className={cn('h-7 w-7', config.iconColor)} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Ranking visual ────────────────────────────────────────────────────────────
// Five placeholder investor rows with animated score bars filling in.

const RANK_BARS = [
  { pct: '93%', delay: 0 },
  { pct: '81%', delay: 0.12 },
  { pct: '74%', delay: 0.24 },
  { pct: '66%', delay: 0.36 },
  { pct: '58%', delay: 0.48 },
];

function RankingVisual({ config, reduced }: { config: typeof STAGES[0]; reduced: boolean }) {
  return (
    <div className="w-full max-w-xs space-y-3 px-4">
      {RANK_BARS.map((bar, i) => (
        <div key={i} className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <motion.div
            className="w-7 h-7 rounded-full bg-muted shrink-0"
            animate={!reduced ? { opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 1.8, delay: bar.delay, repeat: Infinity }}
          />
          <div className="flex-1 space-y-1">
            {/* Name placeholder */}
            <motion.div
              className="h-2 rounded bg-muted"
              style={{ width: `${55 + i * 7}%` }}
              animate={!reduced ? { opacity: [0.3, 0.6, 0.3] } : {}}
              transition={{ duration: 1.8, delay: bar.delay + 0.1, repeat: Infinity }}
            />
            {/* Score bar */}
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: config.glow }}
                initial={{ width: 0 }}
                animate={{ width: bar.pct }}
                transition={{ duration: 0.9, delay: bar.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 3.5 }}
              />
            </div>
          </div>
          {/* Score badge */}
          <motion.div
            className="text-xs tabular-nums font-medium shrink-0"
            style={{ color: config.glow }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: bar.delay + 0.9 }}
          >
            {bar.pct}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AgentProgressBar() {
  const agentStage   = useAppStore((s) => s.agentStage);
  const agentMessage = useAppStore((s) => s.agentMessage);
  const agentLog     = useAppStore((s) => s.agentLog);
  const reduced      = useReducedMotion() ?? false;

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const stageIndex  = STAGES.findIndex((s) => s.id === agentStage);
  const config      = STAGES[Math.max(0, stageIndex)];
  const isConnecting = agentStage === null;
  const isComplete   = agentStage === 'complete';
  const allMessages  = agentMessage ? [agentMessage, ...agentLog] : agentLog;

  return (
    <div className="space-y-5 py-1">

      {/* ── Stage pipeline pills ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {STAGES.map((stage, i) => {
          const done   = !isConnecting && !isComplete && stageIndex > i;
          const active = !isConnecting && !isComplete && stageIndex === i;
          const Icon   = stage.Icon;
          return (
            <div key={stage.id} className="flex items-center gap-1.5">
              <motion.div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  done   && 'bg-primary/10 border-primary/25 text-primary',
                  active && 'bg-primary/15 border-primary/35 text-primary',
                  !done && !active && 'bg-transparent border-border/60 text-muted-foreground',
                )}
                animate={active && !reduced ? { scale: [1, 1.025, 1] } : {}}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {done
                  ? <Check className="h-3 w-3" />
                  : <Icon className={cn('h-3 w-3', active && 'animate-pulse')} />
                }
                {stage.pill}
              </motion.div>
              {i < STAGES.length - 1 && (
                <motion.div
                  className="h-px w-5 rounded-full bg-border"
                  animate={done ? { backgroundColor: 'hsl(var(--primary) / 0.4)' } : {}}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Central animation canvas ─────────────────────────────────────────── */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          height: 240,
          background: isConnecting ? undefined : config.bg,
          transition: 'background 0.6s ease',
        }}
      >
        <AnimatePresence mode="wait">
          {isConnecting && (
            <motion.div
              key="connecting"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Indeterminate shimmer */}
              <div className="space-y-3 w-48 text-center">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full w-1/3 bg-primary/40 rounded-full"
                    animate={{ x: ['-100%', '400%'] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Initializing search…</p>
              </div>
            </motion.div>
          )}

          {agentStage === 'searching' && (
            <motion.div key="searching" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SearchingVisual config={config} reduced={reduced} />
            </motion.div>
          )}

          {agentStage === 'synthesis' && (
            <motion.div key="synthesis" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SynthesisVisual config={config} reduced={reduced} />
            </motion.div>
          )}

          {agentStage === 'ranking' && (
            <motion.div key="ranking" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <RankingVisual config={config} reduced={reduced} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stage label ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!isConnecting && !isComplete && (
          <motion.div
            key={agentStage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-0.5"
          >
            <p className="text-sm font-semibold">{config.fullLabel}</p>
            <p className="text-xs text-muted-foreground">{config.sublabel}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Activity log ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {allMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3 space-y-2"
          >
            <AnimatePresence initial={false}>
              {allMessages.slice(0, 4).map((msg, i) => (
                <motion.div
                  key={msg}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1 - i * 0.22, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2 text-xs"
                >
                  <div className={cn(
                    'mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 mt-1',
                    i === 0 ? 'bg-primary' : 'bg-muted-foreground/25',
                  )} />
                  <span className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>
                    {msg}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Elapsed ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-end text-xs text-muted-foreground/60 tabular-nums">
        {formatElapsed(elapsed)}
      </div>
    </div>
  );
}
