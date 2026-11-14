"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { checkAccess } from "@/lib/access-rules";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, logout } = useAuth();

  const customerSiteUrl =
    process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || "http://localhost:3000";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@tripwheels.in";

  const access = !isLoading ? checkAccess(pathname, user, profile) : null;

  useEffect(() => {
    if (!isLoading && access && access.status === "redirect") {
      router.push(access.to);
    }
  }, [isLoading, access, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--paper) p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-(--brand) border-t-transparent animate-spin" />
          <p className="text-xs text-(--ink-soft)">Checking partner session...</p>
        </div>
      </div>
    );
  }

  // Redirecting state
  if (!access || access.status === "redirect") {
    return null;
  }

  // Blocked: Role Mismatch (Customer or Admin)
  if (access.status === "blocked" && access.reason === "role_mismatch") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--paper) p-4">
        <div className="w-full max-w-md p-8 rounded-md border border-(--line) bg-(--surface) text-center">
          <h1 className="text-xl font-bold font-display text-(--ink)">
            Partner dashboard access
          </h1>
          <p className="mt-3 text-sm text-(--ink-soft) leading-relaxed">
            This is the partner dashboard for agents and owners. Travelers book on{" "}
            <a
              href={customerSiteUrl}
              className="font-medium text-(--brand) underline"
            >
              tripwheels.in
            </a>
            .
          </p>
          <div className="mt-6">
            <Button variant="secondary" size="md" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Blocked: Account or Publisher Suspended
  if (access.status === "blocked" && access.reason === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--paper) p-4">
        <div className="w-full max-w-md p-8 rounded-md border border-red-200 bg-(--surface) text-center">
          <h1 className="text-xl font-bold font-display text-(--negative)">
            Account suspended
          </h1>
          <p className="mt-3 text-sm text-(--ink-soft) leading-relaxed">
            Your partner account has been suspended by the administrator team. You cannot manage vehicles or accept booking requests while suspended.
          </p>
          <div className="mt-4 p-3 rounded bg-(--paper) border border-(--line) text-xs text-(--ink)">
            For assistance, contact support at{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="font-semibold text-(--brand) underline"
            >
              {supportEmail}
            </a>
          </div>
          <div className="mt-6">
            <Button variant="secondary" size="md" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Blocked: Verification Required for vehicles, bookings, schedule
  if (access.status === "blocked" && access.reason === "verification_required") {
    return (
      <AppShell
        title="Verification required"
        subtitle="Complete your verification to unlock this section"
      >
        <div className="p-8 rounded-md border border-(--line) bg-(--surface) text-center max-w-xl mx-auto">
          <h2 className="text-lg font-bold font-display text-(--ink)">
            Verification needed
          </h2>
          <p className="mt-2 text-sm text-(--ink-soft) leading-relaxed">
            Vehicles, bookings, and your calendar schedule become active after your partner profile is verified and approved by the admin team.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/verification">
              <Button variant="primary" size="md">
                Go to verification
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" size="md">
                Back to today
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return children;
}
