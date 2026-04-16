"use client";

import { useState } from "react";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Pencil, Check, X, Sparkles, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanBadge } from "@/components/layout/PlanBadge";
import { UsageBar } from "@/components/layout/UsageBar";
import { apiFetch } from "@/lib/api";

interface UserMe {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "pro" | "enterprise";
  searches_used: number;
  searches_this_month: number;
  created_at: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: Infinity,
  enterprise: Infinity,
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "3 searches / month included",
  pro: "Unlimited searches",
  enterprise: "Unlimited searches + priority support",
};

export default function SettingsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { data: meData, isPending } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<UserMe>("/users/me", getToken),
    staleTime: 5 * 60 * 1000,
  });

  function startEdit() {
    setFirstName(clerkUser?.firstName ?? "");
    setLastName(clerkUser?.lastName ?? "");
    setSaveError("");
    setEditing(true);
  }

  async function saveProfile() {
    if (!clerkUser) return;
    setSaving(true);
    setSaveError("");
    try {
      await clerkUser.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setEditing(false);
    } catch (e) {
      setSaveError((e as Error).message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
  }

  const plan = meData?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 3;
  const memberSince = meData?.created_at
    ? new Date(meData.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* ── Profile ──────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Profile
        </h2>

        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={clerkUser?.imageUrl} />
            <AvatarFallback className="text-lg font-semibold">
              {clerkUser?.firstName?.[0]}
              {clerkUser?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            {!editing ? (
              <>
                <p className="font-semibold text-base leading-tight">
                  {clerkUser?.fullName ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {clerkUser?.primaryEmailAddress?.emailAddress}
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                  />
                  <input
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                {saveError && (
                  <p className="text-xs text-destructive">{saveError}</p>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0">
            {!editing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={startEdit}
                disabled={!isLoaded}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit name
              </Button>
            ) : (
              <div className="flex gap-1.5">
                <Button size="sm" onClick={saveProfile} disabled={saving}>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {memberSince && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-4">
            <CalendarDays className="h-3.5 w-3.5" />
            Member since {memberSince}
          </div>
        )}
      </section>

      {/* ── Plan & Usage ─────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Plan &amp; Usage
        </h2>

        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current plan</span>
                  <PlanBadge plan={plan} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {PLAN_DESCRIPTIONS[plan] ?? "Unknown plan"}
                </p>
              </div>

              {plan === "free" && (
                <Button asChild size="sm">
                  <Link href="/pricing">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Upgrade Plan
                  </Link>
                </Button>
              )}
              {plan === "pro" && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/pricing">Manage Plan</Link>
                </Button>
              )}
            </div>

            {plan === "free" && meData && (
              <UsageBar used={meData.searches_this_month} limit={limit} />
            )}

            {plan !== "free" && meData && (
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {meData.searches_this_month}
                </span>{" "}
                searches this month
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Account ──────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Account
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">
              Sign out of your account on this device
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSignOutDialog(true)}
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign out
          </Button>
        </div>
      </section>

      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You&apos;ll be signed out of your account on this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowSignOutDialog(false)}
              disabled={signingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
