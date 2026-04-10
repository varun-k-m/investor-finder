import posthog from 'posthog-js';

let initialised = false;

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialised || typeof window === 'undefined') return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialised = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}
