"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <Container size="narrow">
        <div className="rounded-lg border border-line bg-paper-card p-8 text-center max-w-md mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-paper-light border border-line text-ink-muted">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-5.657-2.657m0 0a9 9 0 010-12.728m0 0l2.829 2.829m-2.829-2.829L3 3m5.464 5.464a5 5 0 017.072 0"
              />
            </svg>
          </div>

          <h1 className="font-serif text-2xl font-bold text-ink">
            You are offline
          </h1>

          <p className="text-sm text-ink-muted leading-relaxed">
            The internet connection was lost. Please check your network or Wi-Fi connection and try again.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>

            <Link href="/">
              <Button variant="secondary" size="md">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
