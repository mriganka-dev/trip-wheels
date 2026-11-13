"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { isStandalone, isIos, isPwaPromptDismissed, dismissPwaPrompt } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Hide if already running as installed standalone app or dismissed
      if (isStandalone() || isPwaPromptDismissed()) {
        return;
      }

      setIsDismissed(false);

      // iOS Detection
      if (isIos()) {
        setShowIosBanner(true);
      }
    }, 0);

    // Android / Chromium beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
      setIsDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    dismissPwaPrompt(14);
    setIsDismissed(true);
    setShowInstallPrompt(false);
    setShowIosBanner(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      handleDismiss();
    }
  };

  if (isDismissed || (!showInstallPrompt && !showIosBanner)) {
    return null;
  }

  return (
    <aside
      aria-label="Install Trip Wheels App"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 rounded-lg border border-line bg-paper-card p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-paper-light">
          <Image
            src="/icons/icon-192.png"
            alt="Trip Wheels"
            fill
            sizes="40px"
            className="object-contain"
          />
        </div>

        <div className="flex-1">
          <h3 className="font-serif text-sm font-bold text-ink">
            Install Trip Wheels
          </h3>

          {showInstallPrompt && (
            <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
              Install the app on your home screen for quick booking alerts and offline access.
            </p>
          )}

          {showIosBanner && (
            <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
              Install on your iPhone: tap{" "}
              <span className="font-semibold text-ink">Share</span>, then{" "}
              <span className="font-semibold text-ink">Add to Home Screen</span>.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {showInstallPrompt && deferredPrompt && (
              <Button size="sm" variant="primary" onClick={handleInstallClick}>
                Install App
              </Button>
            )}

            <Button size="sm" variant="quiet" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-1 text-ink-muted hover:text-ink hover:bg-paper-light"
          aria-label="Close install prompt"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
