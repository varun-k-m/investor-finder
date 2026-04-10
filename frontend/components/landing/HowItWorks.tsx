import { Search, Zap, BarChart2, Mail } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Describe your idea',
    description: 'Tell us your startup, sector, stage, and how much you\'re raising.',
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
  return (
    <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-14">How it works</h2>

      <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4">
        {/* Dashed connector — desktop only */}
        <div className="hidden sm:block absolute top-6 left-[12.5%] right-[12.5%] h-px border-t border-dashed border-border" />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="relative flex flex-col items-center text-center gap-3 z-10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary">0{i + 1}</span>
              <h3 className="font-semibold text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
