'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/useCountUp';
import { InvestorPreviewWindow } from './InvestorPreviewWindow';

const ACTIVITY_FEED = [
  '14 founders searching right now',
  'Priya just matched with 11 climate investors',
  'Carlos found his lead investor in 48 hours',
  '3 new investors added today',
  '$2.1M raised by founders this week',
  'James closed his round in 6 weeks',
];

function LiveActivityBadge() {
  const [idx, setIdx] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = setInterval(() => {
      setIdx((prev) => (prev + 1) % ACTIVITY_FEED.length);
    }, 3600);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/80 border border-border rounded-full px-3 py-1.5 mb-6 shadow-sm">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
        >
          {ACTIVITY_FEED[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const SEARCHES = [
  'B2B SaaS for logistics, pre-seed, raising $1.5M',
  'Consumer health app, seed stage, raising $3M',
  'Climate tech hardware, Series A, raising $8M',
  'AI coding tools for enterprise, pre-seed, raising $2M',
  'Fintech for SMBs in Southeast Asia, seed, raising $4M',
];

const STAT_LABELS = [
  'investors indexed',
  'founders onboarded',
  'matches per search',
  'to full results',
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

// Individual stat counter — each manages its own count-up animation
function StatItem({
  target,
  duration,
  format,
  label,
  enabled,
}: {
  target: number;
  duration: number;
  format: (n: number) => string;
  label: string;
  enabled: boolean;
}) {
  const count = useCountUp(target, duration, enabled);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold tabular-nums">{format(count)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const [searchIdx, setSearchIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  // Stats count-up fires once when they scroll into view
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-60px' });
  const countEnabled = statsInView && !shouldReduceMotion;

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayed(SEARCHES[0]);
      return;
    }

    const target = SEARCHES[searchIdx];
    let i = 0;
    setDisplayed('');
    setTyping(true);

    const typeTimer = setInterval(() => {
      i++;
      setDisplayed(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(typeTimer);
        setTyping(false);
        const pause = setTimeout(() => {
          setSearchIdx((prev) => (prev + 1) % SEARCHES.length);
        }, 2400);
        return () => clearTimeout(pause);
      }
    }, 38);

    return () => clearInterval(typeTimer);
  }, [searchIdx, shouldReduceMotion]);

  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/10 blur-[130px] animate-pulse"
          style={{ animationDuration: '7s' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-primary/8 blur-[110px] animate-pulse"
          style={{ animationDuration: '9s', animationDelay: '2s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[280px] rounded-full bg-primary/5 blur-[90px]" />
      </div>

      {!shouldReduceMotion && <LiveActivityBadge />}

      <motion.span
        className="relative inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-6 tracking-wide"
        {...(shouldReduceMotion ? {} : fadeUp(0))}
      >
        AI-Powered · Real-time · Personalised
      </motion.span>

      <motion.h1
        className="relative text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight max-w-3xl"
        {...(shouldReduceMotion ? {} : fadeUp(0.1))}
      >
        Find the right investors<br />for your startup — fast.
      </motion.h1>

      <motion.p
        className="relative mt-5 text-lg text-muted-foreground max-w-xl"
        {...(shouldReduceMotion ? {} : fadeUp(0.2))}
      >
        Describe your idea. Our AI searches the global investor network in real time,
        ranks matches by fit, and generates personalised pitches — all in under a minute.
      </motion.p>

      {/* Animated fake search demo */}
      <motion.div
        className="relative mt-8 w-full max-w-lg rounded-xl border border-border bg-card/70 backdrop-blur-sm px-4 py-3 text-left text-sm shadow-sm"
        {...(shouldReduceMotion ? {} : fadeUp(0.28))}
      >
        <span className="text-xs font-semibold text-primary mr-2">Try:</span>
        <span className="text-muted-foreground">{displayed}</span>
        <span
          className={`inline-block w-0.5 h-[14px] bg-primary ml-0.5 align-text-bottom transition-opacity ${
            typing ? 'opacity-100 animate-pulse' : 'opacity-0'
          }`}
        />
      </motion.div>

      <motion.div
        className="relative mt-6 flex flex-col sm:flex-row items-center gap-4"
        {...(shouldReduceMotion ? {} : fadeUp(0.36))}
      >
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button size="lg" className="relative overflow-hidden px-8 text-base shadow-lg">
            <span className="relative z-10">Get My Investors — Free →</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </Button>
        </SignInButton>
        <a
          href="#how-it-works"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See how it works ↓
        </a>
      </motion.div>

      {/* Stats trust bar — count up on scroll into view */}
      <motion.div
        ref={statsRef}
        className="relative mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4"
        {...(shouldReduceMotion ? {} : fadeUp(0.46))}
      >
        <StatItem
          target={2400}
          duration={1.6}
          format={(n) => `${n.toLocaleString()}+`}
          label={STAT_LABELS[0]}
          enabled={countEnabled}
        />
        <StatItem
          target={600}
          duration={1.4}
          format={(n) => `${n}+`}
          label={STAT_LABELS[1]}
          enabled={countEnabled}
        />
        <StatItem
          target={14}
          duration={1.0}
          format={(n) => `avg ${n}`}
          label={STAT_LABELS[2]}
          enabled={countEnabled}
        />
        <StatItem
          target={60}
          duration={0.9}
          format={(n) => `<${n}s`}
          label={STAT_LABELS[3]}
          enabled={countEnabled}
        />
      </motion.div>

      {/* Product preview window */}
      <div className="relative w-full max-w-2xl">
        <InvestorPreviewWindow />
      </div>
    </section>
  );
}
