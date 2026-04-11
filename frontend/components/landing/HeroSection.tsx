'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

const SEARCHES = [
  'B2B SaaS for logistics, pre-seed, raising $1.5M',
  'Consumer health app, seed stage, raising $3M',
  'Climate tech hardware, Series A, raising $8M',
  'AI coding tools for enterprise, pre-seed, raising $2M',
  'Fintech for SMBs in Southeast Asia, seed, raising $4M',
];

const STATS = [
  { value: '2,400+', label: 'investors indexed' },
  { value: '600+', label: 'founders onboarded' },
  { value: 'avg 14', label: 'matches per search' },
  { value: '<60s', label: 'to full results' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const [searchIdx, setSearchIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

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
          <Button size="lg" className="px-8 text-base shadow-lg">
            Find My Investors →
          </Button>
        </SignInButton>
        <a
          href="#how-it-works"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See how it works ↓
        </a>
      </motion.div>

      {/* Stats trust bar */}
      <motion.div
        className="relative mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4"
        {...(shouldReduceMotion ? {} : fadeUp(0.46))}
      >
        {STATS.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            {i > 0 && (
              <span className="hidden sm:block absolute h-6 w-px bg-border -left-5 top-1/2 -translate-y-1/2" />
            )}
            <span className="text-xl font-bold">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
