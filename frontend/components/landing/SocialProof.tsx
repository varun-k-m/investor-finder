'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

const QUOTES = [
  {
    quote: 'Found 3 investors who led our seed round — all through InvestorMatch.',
    name: 'Alex T.',
    company: 'Finstack',
    initials: 'AT',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    quote: 'The fit scoring saved us weeks of research. We closed our round in 6 weeks.',
    name: 'Priya K.',
    company: 'MedLayer',
    initials: 'PK',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    quote: 'Generated personalised pitches for 20 investors in minutes. Game changer.',
    name: 'James O.',
    company: 'Orbital Labs',
    initials: 'JO',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="px-6 py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-center mb-12"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Founders love it
        </motion.h2>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {QUOTES.map((q, i) => (
            <motion.div
              key={q.name}
              className="rounded-xl border border-border bg-card p-6 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Stars />
              <p className="text-sm leading-relaxed text-foreground">&ldquo;{q.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${q.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                >
                  {q.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold">{q.name}</p>
                  <p className="text-xs text-muted-foreground">Founder @ {q.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
