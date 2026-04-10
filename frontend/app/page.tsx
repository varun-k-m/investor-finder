'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-base">InvestorMatch</span>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="outline" size="sm">Sign in</Button>
        </SignInButton>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 space-y-8">
        <div className="space-y-4 max-w-2xl">
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
            AI-Powered Investor Discovery
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Find the right investors<br />for your startup — fast.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Describe your idea. Our AI searches the global investor network in real time,
            ranks matches by fit, and generates personalised pitches — all in under a minute.
          </p>
        </div>

        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button size="lg" className="px-8 text-base">
            Find My Investors →
          </Button>
        </SignInButton>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl w-full text-left">
          {[
            {
              icon: '🔍',
              title: 'Smart Discovery',
              desc: 'AI searches Crunchbase, AngelList, and the open web in parallel to surface relevant investors.',
            },
            {
              icon: '📊',
              title: 'Fit Scoring',
              desc: 'Every investor is ranked by sector, stage, budget, and geography fit — no manual filtering.',
            },
            {
              icon: '✉️',
              title: 'Personalised Pitches',
              desc: 'Generate a tailored pitch draft for each investor with one click, ready to send.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-5 space-y-2">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} InvestorMatch · AI-powered investor discovery for founders
      </footer>
    </div>
  );
}
