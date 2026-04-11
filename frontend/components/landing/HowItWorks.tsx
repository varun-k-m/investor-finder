'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Search, Zap, BarChart2, Mail } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Describe your idea',
    description: "Tell us your startup, sector, stage, and how much you're raising.",
  },
  {
    icon: Zap,
    title: 'AI discovery',
    description: 'Our agent searches Crunchbase, AngelList, and the open web in parallel.',
  },
  {
    icon: BarChart2,
    title: 'Fit scoring',
    description: 'Every investor ranked by sector, stage, check size, and geography match.',
  },
  {
    icon: Mail,
    title: 'Pitch in one click',
    description: 'Generate a personalised pitch draft for each investor instantly.',
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto">
      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-center mb-14"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        How it works
      </motion.h2>

      <div ref={ref} className="relative grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4">
        {/* Animated connector line — desktop only */}
        <div className="hidden sm:block absolute top-6 left-[12.5%] right-[12.5%] h-px overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </div>

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              className="relative flex flex-col items-center text-center gap-3 z-10"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.13 }}
            >
              {/* Icon circle */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              {/* Step badge */}
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow">
                {String(i + 1).padStart(2, '0')}
              </span>

              <h3 className="font-semibold text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
