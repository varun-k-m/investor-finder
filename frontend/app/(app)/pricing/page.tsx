'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface UserMe {
  plan: 'free' | 'pro' | 'enterprise';
}

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
  const { getToken } = useAuth();
  const [comingSoon, setComingSoon] = useState(false);

  const { data: meData } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => apiFetch<UserMe>('/users/me', getToken),
    staleTime: 5 * 60 * 1000,
  });

  const currentPlan = meData?.plan ?? null;
  const isFreePlan = currentPlan === 'free' || currentPlan === null;
  const isProPlan = currentPlan === 'pro' || currentPlan === 'enterprise';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Simple, transparent pricing</h1>
        <p className="text-muted-foreground">Start free. Upgrade when you need more.</p>
      </div>

      {comingSoon && (
        <div className="mb-6 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-blue-800 dark:text-blue-300 text-sm text-center">
          Billing coming soon — we&apos;ll notify you when Pro is available!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free plan */}
        <div
          className={cn(
            'rounded-xl border bg-card p-6 flex flex-col relative transition-all',
            isFreePlan
              ? 'border-2 border-primary shadow-sm'
              : 'border-border opacity-70',
          )}
        >
          {isFreePlan && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                Current Plan
              </span>
            </div>
          )}

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
            {isFreePlan ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* Pro plan */}
        <div
          className={cn(
            'rounded-xl border-2 bg-card p-6 flex flex-col relative transition-all',
            isProPlan
              ? 'border-primary shadow-sm'
              : 'border-blue-500',
          )}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span
              className={cn(
                'text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide',
                isProPlan
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-blue-500 text-white',
              )}
            >
              {isProPlan ? 'Current Plan' : 'Most Popular'}
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
                <CheckIcon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isProPlan ? 'text-primary' : 'text-blue-500',
                  )}
                />
                {f}
              </li>
            ))}
          </ul>

          {isProPlan ? (
            <button
              disabled
              className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
            >
              Current Plan
            </button>
          ) : (
            <button
              onClick={() => setComingSoon(true)}
              className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
