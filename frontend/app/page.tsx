'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SocialProof } from '@/components/landing/SocialProof';
import { PricingTeaser } from '@/components/landing/PricingTeaser';

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
      {/* Sticky nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
        <span className="font-semibold text-base">InvestorMatch</span>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <Button variant="ghost" size="sm">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
            <Button size="sm" className="relative overflow-hidden">
              <span className="relative z-10">Get started free</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
            </Button>
          </SignUpButton>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <SocialProof />
        <PricingTeaser />
      </main>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} InvestorMatch · AI-powered investor discovery for founders
      </footer>
    </div>
  );
}
