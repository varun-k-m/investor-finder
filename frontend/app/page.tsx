'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, useUser } from '@clerk/nextjs';
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
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="outline" size="sm">Sign in</Button>
        </SignInButton>
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
