"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleIdleSignOut = async () => {
    await logout();
    router.push("/login?reason=idle");
  };

  const { isWarningOpen, staySignedIn } = useIdleTimeout({
    onSignOut: handleIdleSignOut,
    isPaused: isLoading || !isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const fullPath = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      router.push(`/login?next=${encodeURIComponent(fullPath)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper p-6 flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-line rounded p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">Access restricted</h1>
          <p className="text-sm text-ink-soft mt-2 mb-6">
            This console is for the Trip Wheels team.
          </p>
          <Button variant="secondary" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      <Dialog open={isWarningOpen} onOpenChange={() => {}}>
        <DialogContent
          title="Session Inactivity Warning"
          showClose={false}
          className="max-w-sm"
        >
          <p className="text-sm text-ink">
            You will be signed out in 1 minute because of inactivity.
          </p>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={staySignedIn}>
              Stay signed in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
