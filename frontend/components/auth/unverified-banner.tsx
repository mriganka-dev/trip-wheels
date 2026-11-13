"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "@/components/layout/container";

export function UnverifiedEmailBanner() {
  const { user, isAuthenticated, isEmailVerified } = useAuth();

  if (!isAuthenticated || !user || isEmailVerified) {
    return null;
  }

  return (
    <aside
      aria-label="Email verification notice"
      className="border-b border-amber-200 bg-amber-50 py-2.5 text-xs text-(--ink)"
    >
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-(--warning) shrink-0" />
            <span>
              Your email is not verified yet. Vehicle booking requests are blocked until verified.
            </span>
          </div>
          <Link
            href={`/verify-email?email=${encodeURIComponent(user.email)}`}
            className="font-semibold text-(--brand) hover:text-(--brand-dark) underline underline-offset-2 shrink-0"
          >
            Verify your email now
          </Link>
        </div>
      </Container>
    </aside>
  );
}

