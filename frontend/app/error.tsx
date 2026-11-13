"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for review
  }, [error]);

  return (
    <main className="py-20">
      <Container size="narrow">
        <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-(--negative)">
            Error
          </p>
          <h1 className="mt-2 text-2xl font-bold font-display text-(--ink)">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-(--ink-soft) max-w-md mx-auto">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => reset()}>
              Try again
            </Button>
            <Link
              href="/"
              className="inline-flex items-center justify-center font-medium rounded-md px-3 py-1.5 text-xs text-(--ink) hover:bg-(--brand-tint) transition-colors"
            >
              Go to home
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
