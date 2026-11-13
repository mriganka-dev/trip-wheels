"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else if (user.role !== "customer") {
        router.push("/non-customer");
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <main className="py-12">
        <Container>
          <div className="space-y-4 max-w-xl mx-auto">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Container>
      </main>
    );
  }

  if (!isAuthenticated || !user || user.role !== "customer") {
    return null;
  }

  return <>{children}</>;
}

