'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { Search, Zap, BarChart2, Mail } from 'lucide-react';

// ─── Step data ────────────────────────────────────────────────────────────────

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

// ─── Step 0: Describe preview ─────────────────────────────────────────────────

const DEMO_QUERY = 'B2B SaaS for logistics, pre-seed, raising $1.5M';
const DEMO_TAGS = ['Pre-seed', 'B2B SaaS', '$1.5M raise'];

function Step0Preview() {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setText(DEMO_QUERY.slice(0, i));
      if (i >= DEMO_QUERY.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 32);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-lg border border-border bg-background/80 px-4 py-3 text-sm min-h-[48px]">
        <span className="text-muted-foreground">{text}</span>
        {!done && (
          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-text-bottom animate-pulse" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {DEMO_TAGS.map((tag, i) => (
          <motion.span
            key={tag}
            className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.15, duration: 0.25 }}
          >
            {tag}
          </motion.span>
        ))}
      </div>
      <motion.div
        className="flex items-center gap-2 mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="h-9 rounded-md bg-primary px-4 flex items-center text-xs font-semibold text-primary-foreground shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
        >
          Find My Investors →
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Step 1: AI Discovery preview ─────────────────────────────────────────────

const SOURCES = [
  { name: 'Crunchbase', found: '340 investors', delay: 0.1 },
  { name: 'AngelList', found: '287 investors', delay: 0.55 },
  { name: 'Open Web', found: '220 investors', delay: 1.0 },
];

function Step1Preview() {
  return (
    <div className="space-y-4 w-full">
      <p className="text-xs text-muted-foreground">Scanning global investor databases...</p>
      {SOURCES.map(({ name, found, delay }) => (
        <div key={name} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{name}</span>
            <motion.span
              className="text-emerald-600 dark:text-emerald-400 font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.7 }}
            >
              {found} ✓
            </motion.span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.55, delay, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
      <motion.div
        className="pt-1 border-t border-border text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
      >
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">847</span>
        {' '}potential matches — narrowing by fit…
      </motion.div>
    </div>
  );
}

// ─── Step 2: Fit Scoring preview ──────────────────────────────────────────────

const RANKED = [
  { name: 'Accel Partners', score: 94, barColor: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', avatarGradient: 'from-blue-500 to-indigo-600', initials: 'AC' },
  { name: 'Bessemer Venture', score: 88, barColor: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', avatarGradient: 'from-violet-500 to-purple-600', initials: 'BV' },
  { name: 'First Round Capital', score: 81, barColor: 'bg-violet-500', textColor: 'text-violet-600 dark:text-violet-400', avatarGradient: 'from-emerald-500 to-teal-600', initials: 'FR' },
];

function Step2Preview() {
  return (
    <div className="space-y-4 w-full">
      <p className="text-xs text-muted-foreground">Ranked by overall fit score</p>
      {RANKED.map(({ name, score, barColor, textColor, avatarGradient, initials }, i) => (
        <motion.div
          key={name}
          className="space-y-1.5"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2, duration: 0.35 }}
        >
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
            >
              {initials}
            </div>
            <span className="flex-1 font-medium">{name}</span>
            <span className={`font-bold tabular-nums ${textColor}`}>{score}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden ml-8">
            <motion.div
              className={`h-full ${barColor} rounded-full`}
              initial={{ width: '0%' }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.65, delay: 0.15 + i * 0.2, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      ))}
      <motion.p
        className="text-xs text-muted-foreground pt-1 border-t border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        + 11 more ranked investors waiting
      </motion.p>
    </div>
  );
}

// ─── Step 3: Pitch preview ─────────────────────────────────────────────────────

const PITCH_LINES = [
  'Hi Rich,',
  '',
  "I'm building LogiSaaS — B2B SaaS that cuts",
  'freight costs 30% with AI route optimization.',
  '',
  "We're raising a $1.5M pre-seed. Accel's focus",
  'on operational SaaS is a perfect fit.',
  '',
  'Happy to share our deck — 15 min?',
];

function Step3Preview() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible((v) => {
        if (v >= PITCH_LINES.length) {
          clearInterval(timer);
          return v;
        }
        return v + 1;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-lg border border-border bg-background/80 overflow-hidden">
      {/* Email chrome header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
        <span className="text-[11px] text-muted-foreground">
          Draft pitch · <span className="text-foreground font-medium">Accel Partners</span>
        </span>
        <motion.span
          className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          Generated ✓
        </motion.span>
      </div>
      {/* Pitch body */}
      <div className="px-4 py-3 space-y-0.5 font-mono text-xs min-h-[140px]">
        {PITCH_LINES.slice(0, visible).map((line, i) => (
          <motion.p
            key={i}
            className="leading-relaxed text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {line || '\u00A0'}
          </motion.p>
        ))}
        {visible < PITCH_LINES.length && (
          <span className="inline-block w-0.5 h-3.5 bg-primary align-text-bottom animate-pulse" />
        )}
      </div>
    </div>
  );
}

// ─── Preview panel router ──────────────────────────────────────────────────────

const PREVIEWS = [Step0Preview, Step1Preview, Step2Preview, Step3Preview];

function StepPreview({ step }: { step: number }) {
  const Preview = PREVIEWS[step];
  return <Preview />;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto">
      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-center mb-4"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        How it works
      </motion.h2>
      <motion.p
        className="text-center text-sm text-muted-foreground mb-12"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.08 }}
      >
        Click any step to see it in action.
      </motion.p>

      <div ref={ref} className="flex flex-col md:flex-row gap-8 items-start">

        {/* ── Step list (left column) ── */}
        <div className="flex flex-col gap-3 md:w-[52%] shrink-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = activeStep === i;
            return (
              <motion.button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`relative w-full text-left rounded-xl border px-4 py-4 flex items-start gap-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? 'border-primary/60 bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
                }`}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.1 }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="active-bar"
                    className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div
                  className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed pl-7">
                    {step.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ── Preview panel (right column) ── */}
        <div className="w-full md:flex-1 md:sticky md:top-24">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 min-h-[240px] shadow-sm">
            {/* Panel header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-400/70" />
                <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                <div className="w-2 h-2 rounded-full bg-green-400/70" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Step {activeStep + 1} · {STEPS[activeStep].title}
              </span>
            </div>

            {/* Animated step preview */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <StepPreview step={activeStep} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step dot nav — mobile quick-jump */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  activeStep === i ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
