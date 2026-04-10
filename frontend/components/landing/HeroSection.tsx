'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
      <motion.span
        className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-6 tracking-wide"
        {...(shouldReduceMotion ? {} : fadeUp(0))}
      >
        AI-Powered · Real-time · Personalised
      </motion.span>

      <motion.h1
        className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight max-w-3xl"
        {...(shouldReduceMotion ? {} : fadeUp(0.1))}
      >
        Find the right investors<br />for your startup — fast.
      </motion.h1>

      <motion.p
        className="mt-5 text-lg text-muted-foreground max-w-xl"
        {...(shouldReduceMotion ? {} : fadeUp(0.2))}
      >
        Describe your idea. Our AI searches the global investor network in real time,
        ranks matches by fit, and generates personalised pitches — all in under a minute.
      </motion.p>

      <motion.div
        className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        {...(shouldReduceMotion ? {} : fadeUp(0.3))}
      >
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button size="lg" className="px-8 text-base">
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
    </section>
  );
}
