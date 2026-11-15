"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissInstallPrompt,
  isInstallPromptDismissed,
  isIosSafari,
  isStandalone,
} from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Hide if already running as standalone PWA
    if (isStandalone() || isInstallPromptDismissed()) {
      return;
    }

    const timer = setTimeout(() => {
      setIsDismissed(false);
      if (isIosSafari()) {
        setShowIosBanner(true);
      }
    }, 0);

    // Android / Chromium beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanPromptInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    dismissInstallPrompt(14);
    setIsDismissed(true);
    setCanPromptInstall(false);
    setShowIosBanner(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setCanPromptInstall(false);
      }
    } catch {
      // Ignore prompt errors
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (isDismissed) {
    return null;
  }

  // 1. Android / Chromium Banner
  if (canPromptInstall && deferredPrompt) {
    return (
      <aside
        aria-label="Install app banner"
        className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-40 max-w-md rounded-md border border-(--line) bg-(--surface) p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-(--brand)/10 text-(--brand) flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-(--ink)">
                Install the partner app
              </h4>
              <p className="text-xs text-(--ink-soft)">
                Install Trip Wheels Partner on your phone for faster access and immediate booking alerts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-(--ink-soft) hover:text-(--ink) p-1 rounded hover:bg-(--surface-soft) transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-(--line)">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={handleDismiss}
          >
            Later
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleInstallClick}
          >
            Install
          </Button>
        </div>
      </aside>
    );
  }

  // 2. iOS Safari Instructions Banner
  if (showIosBanner) {
    return (
      <aside
        aria-label="Install on iOS banner"
        className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-40 max-w-md rounded-md border border-(--line) bg-(--surface) p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-(--brand)/10 text-(--brand) flex items-center justify-center shrink-0 mt-0.5">
              <Share className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-(--ink)">
                Install on your Home Screen
              </h4>
              <p className="text-xs text-(--ink-soft)">
                To receive trip alerts on iPhone, tap the Share icon in Safari and select &ldquo;Add to Home Screen&rdquo;.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install instructions"
            className="text-(--ink-soft) hover:text-(--ink) p-1 rounded hover:bg-(--surface-soft) transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end pt-2 border-t border-(--line)">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDismiss}
          >
            Got it
          </Button>
        </div>
      </aside>
    );
  }

  return null;
}
