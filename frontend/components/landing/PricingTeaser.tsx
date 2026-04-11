'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FREE_FEATURES = [
  '3 searches / month',
  'Up to 10 investors per search',
  'Basic fit scoring',
];

const PRO_FEATURES = [
  'Unlimited searches',
  'Up to 50 investors per search',
  'Advanced fit scoring & breakdown',
  'Personalised pitch generation',
  'Priority support',
];

export function PricingTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="px-6 py-20 max-w-4xl mx-auto">
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-center text-muted-foreground text-sm mb-12">
          Start free. Upgrade when you&apos;re ready to raise.
        </p>
      </motion.div>

      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Free */}
        <motion.div
          className="rounded-xl border border-border bg-card p-6 space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <h3 className="font-bold text-lg">Free</h3>
            <p className="text-3xl font-bold mt-1">
              $0<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">Get started free</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">No credit card required</p>
          </div>
        </motion.div>

        {/* Pro */}
        <motion.div
          className="rounded-xl border-2 border-primary bg-card p-6 space-y-5 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.2)]"
          style={{ boxShadow: '0 4px 24px hsl(var(--primary) / 0.12)' }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="absolute top-4 right-4 text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            Popular
          </span>
          <div>
            <h3 className="font-bold text-lg">Pro</h3>
            <p className="text-3xl font-bold mt-1">
              $49<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/pricing">Upgrade to Pro ✨</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">Cancel anytime · 7-day free trial</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
