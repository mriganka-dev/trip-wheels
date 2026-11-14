"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error logged for development review
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--paper) p-4">
      <div className="w-full max-w-md p-8 rounded-md border border-(--line) bg-(--surface) text-center">
        <h1 className="text-xl font-bold font-display text-(--negative)">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-(--ink-soft)">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" size="md" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="primary" size="md">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
