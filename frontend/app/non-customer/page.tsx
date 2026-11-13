"use client";

import React from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function NonCustomerPage() {
  const { logout, isLoggingOut } = useAuth();

  return (
    <main className="py-20">
      <Container size="narrow">
        <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center max-w-md mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Traveler Portal
          </span>
          <h1 className="mt-2 text-xl font-bold font-display text-(--ink)">
            Account notice
          </h1>
          <p className="mt-4 text-sm text-(--ink-soft) leading-relaxed">
            This account is a publisher or admin account. This site is for travelers.
          </p>
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={() => logout()}
              isLoading={isLoggingOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

