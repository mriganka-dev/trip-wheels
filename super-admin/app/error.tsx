"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report or track internally without leaking secrets
  }, [error]);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-line rounded p-8 text-center">
        <h1 className="text-xl font-semibold text-negative">Something went wrong</h1>
        <p className="text-sm text-ink-soft mt-2 mb-6">
          An unexpected error occurred while rendering this console page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
