const QUOTES = [
  {
    quote: 'Found 3 investors who led our seed round — all through InvestorMatch.',
    name: 'Alex T.',
    company: 'Finstack',
    initials: 'AT',
  },
  {
    quote: 'The fit scoring saved us weeks of research. We closed our round in 6 weeks.',
    name: 'Priya K.',
    company: 'MedLayer',
    initials: 'PK',
  },
  {
    quote: 'Generated personalised pitches for 20 investors in minutes. Game changer.',
    name: 'James O.',
    company: 'Orbital Labs',
    initials: 'JO',
  },
];

export function SocialProof() {
  return (
    <section className="px-6 py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Founders love it
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {QUOTES.map((q) => (
            <div
              key={q.name}
              className="rounded-xl border border-border bg-card p-6 space-y-4"
            >
              <p className="text-sm leading-relaxed text-foreground">"{q.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                  {q.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold">{q.name}</p>
                  <p className="text-xs text-muted-foreground">Founder @ {q.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
