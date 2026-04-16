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
  {
    quote: 'Went from zero warm intros to 8 investor meetings in two weeks. Unreal.',
    name: 'Sara M.',
    company: 'Nomi Health',
    initials: 'SM',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    quote: 'The AI actually understood our niche market. Every match was relevant.',
    name: 'Daniel W.',
    company: 'Agristack',
    initials: 'DW',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    quote: 'Worth every penny. Closed our pre-seed 3x faster than our previous attempt.',
    name: 'Fatima R.',
    company: 'Legalise',
    initials: 'FR',
    gradient: 'from-cyan-500 to-sky-600',
  },
];

// Duplicate for seamless infinite scroll
const DOUBLED = [...QUOTES, ...QUOTES];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function QuoteCard({ quote, name, company, initials, gradient }: (typeof QUOTES)[0]) {
  return (
    <div className="w-72 shrink-0 rounded-xl border border-border bg-card p-6 space-y-4">
      <Stars />
      <p className="text-sm leading-relaxed text-foreground">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}
        >
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">Founder @ {company}</p>
        </div>
      </div>
    </div>
  );
}

export function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="px-6 py-20 bg-muted/30 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-center mb-12"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          ref={ref}
        >
          Founders love it
        </motion.h2>
      </div>

      {/* Marquee track — full bleed */}
      <div
        className="relative"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        {shouldReduceMotion ? (
          // Static 3-column grid fallback
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
            {QUOTES.slice(0, 3).map((q) => (
              <QuoteCard key={q.name} {...q} />
            ))}
          </div>
        ) : (
          <div
            className="flex gap-5 animate-marquee hover:[animation-play-state:paused]"
            style={{ width: 'max-content' }}
          >
            {DOUBLED.map((q, i) => (
              <QuoteCard key={i} {...q} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
