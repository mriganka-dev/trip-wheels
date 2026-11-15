"use client";

import React, { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAME } from "@/lib/constants";

export default function OfflinePage() {
  useEffect(() => {
    document.title = `You are offline | ${DASHBOARD_NAME}`;
  }, []);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-(--paper) flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-md border border-(--line) bg-(--surface) p-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-(--surface-soft) border border-(--line) flex items-center justify-center mx-auto text-(--ink-soft)">
          <WifiOff className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-bold font-display text-(--ink)">
            Connection lost
          </h1>
          <p className="text-xs text-(--ink-soft)">
            You are currently offline. Please check your internet connection or mobile network.
          </p>
        </div>

        <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
          Booking requests and vehicle confirmations cannot be received or answered while offline.
        </div>

        <div className="pt-2">
          <Button
            onClick={handleRetry}
            className="w-full bg-(--brand) hover:bg-(--brand-hover) text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry connection
          </Button>
        </div>
      </div>
    </div>
  );
}
