'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Search, Bookmark, Settings, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { identify, track } from '@/lib/posthog';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PlanBadge } from '@/components/layout/PlanBadge';
import { UsageBar } from '@/components/layout/UsageBar';

interface UserMe {
  id: string;
  email: string;
  name: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  searches_used: number;
  searches_this_month: number;
}

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Search', href: '/search', icon: Search },
  { label: 'Saved', href: '/saved', icon: Bookmark },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const FREE_LIMIT = 3;

function SidebarContent({
  meData,
  clerkUser,
  pathname,
  onNavClick,
}: {
  meData?: UserMe;
  clerkUser: ReturnType<typeof useUser>['user'];
  pathname: string;
  onNavClick?: () => void;
}) {
  return (
    <>
      <div className="px-4 py-5 border-b border-border">
        <span className="font-semibold text-base">InvestorMatch</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border-l-2',
                active
                  ? 'border-primary bg-primary/5 text-primary pl-[10px]'
                  : 'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-3 border-t border-border pt-3">
        {/* User row */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={clerkUser?.imageUrl} />
            <AvatarFallback className="text-xs">
              {clerkUser?.firstName?.[0]}{clerkUser?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {clerkUser?.fullName ?? meData?.email}
            </p>
            <PlanBadge plan={meData?.plan} />
          </div>
          <ThemeToggle />
        </div>

        {meData?.plan === 'free' && (
          <UsageBar used={meData.searches_this_month} limit={FREE_LIMIT} />
        )}

        {meData?.plan === 'free' && (
          <Link
            href="/pricing"
            onClick={() => track('upgrade_clicked', { source: 'sidebar' })}
            className="block text-center text-sm bg-blue-600 text-white rounded-lg py-2 px-3 hover:bg-blue-700 transition-colors"
          >
            Upgrade to Pro ✨
          </Link>
        )}

        {meData?.plan === 'pro' && (
          <div className="text-center text-xs text-green-600 font-semibold py-2">Pro Plan ✓</div>
        )}
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 z-40">
        <span className="font-semibold text-sm">InvestorMatch</span>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 md:hidden flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                meData={meData}
                clerkUser={clerkUser}
                pathname={pathname}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 border-r border-border bg-card flex-col">
        <SidebarContent meData={meData} clerkUser={clerkUser} pathname={pathname} />
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-0 md:ml-56 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
