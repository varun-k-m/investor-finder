'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { identify, track } from '@/lib/posthog';

interface UserMe {
  id: string;
  email: string;
  name: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  searches_used: number;
  searches_this_month: number;
}

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Search', href: '/search' },
  { label: 'Saved', href: '/saved' },
  { label: 'Settings', href: '/settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const { data: meData } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => apiFetch<UserMe>('/users/me', getToken),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (clerkUser?.id && meData) {
      identify(clerkUser.id, {
        email: clerkUser.primaryEmailAddress?.emailAddress,
        plan: meData.plan,
      });
    }
  }, [clerkUser, meData]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-56 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-5 border-b border-border">
          <span className="font-semibold text-base">InvestorMatch</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ label, href }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Plan section */}
        <div className="px-3 pb-4 space-y-2">
          {meData?.plan === 'free' && (
            <>
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between mb-1">
                  <span>Searches used</span>
                  <span className="font-medium">{meData.searches_this_month} / 3</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min((meData.searches_this_month / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <Link
                href="/pricing"
                onClick={() => track('upgrade_clicked', { source: 'sidebar' })}
                className="block text-center text-sm bg-blue-600 text-white rounded-lg py-2 px-3 hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro ✨
              </Link>
            </>
          )}
          {meData?.plan === 'pro' && (
            <div className="text-center text-xs text-green-600 font-semibold py-2">
              Pro Plan ✓
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56">{children}</main>
    </div>
  );
}
