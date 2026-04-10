'use client';

import { useState } from 'react';
import { CheckIcon } from 'lucide-react';

const FREE_FEATURES = [
  '3 investor searches / month',
  'AI-powered matching',
  'Fit score breakdown',
  'Pitch draft generation',
];

const PRO_FEATURES = [
  'Unlimited searches',
  'Priority AI processing',
  'Advanced fit scoring',
  'Email notifications',
  'Early access to new features',
];

export default function PricingPage() {
  const [comingSoon, setComingSoon] = useState(false);

  function handleGetPro() {
    setComingSoon(true);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Simple, transparent pricing</h1>
        <p className="text-muted-foreground">Start free. Upgrade when you need more.</p>
      </div>

      {comingSoon && (
        <div className="mb-6 rounded-md bg-blue-50 border border-blue-200 p-4 text-blue-800 text-sm text-center">
          Billing coming soon — we&apos;ll notify you when Pro is available!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free plan */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="text-3xl font-bold mt-2">
              $0{' '}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </div>
          <ul className="space-y-3 flex-1 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Pro plan */}
        <div className="rounded-xl border-2 border-blue-500 bg-card p-6 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
              Most Popular
            </span>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="text-3xl font-bold mt-2">
              $49{' '}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </div>
          <ul className="space-y-3 flex-1 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckIcon className="h-4 w-4 text-blue-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleGetPro}
            className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Pro
          </button>
        </div>
      </div>
    </div>
  );
}
