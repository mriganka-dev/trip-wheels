"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/constants";

export interface UseIdleTimeoutOptions {
  onSignOut: () => void | Promise<void>;
  isPaused?: boolean;
}

export function useIdleTimeout({
  onSignOut,
  isPaused = false,
}: UseIdleTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const warningTimeoutMs = Math.max((IDLE_TIMEOUT_MINUTES - 1) * 60 * 1000, 1000);

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (signoutTimerRef.current) clearTimeout(signoutTimerRef.current);
  }, []);

  const triggerSignOut = useCallback(() => {
    clearTimers();
    setIsWarningOpen(false);
    onSignOut();
  }, [clearTimers, onSignOut]);

  const startTimers = useCallback(() => {
    clearTimers();
    if (isPaused) return;

    warningTimerRef.current = setTimeout(() => {
      setIsWarningOpen(true);
      signoutTimerRef.current = setTimeout(() => {
        triggerSignOut();
      }, 60 * 1000);
    }, warningTimeoutMs);
  }, [clearTimers, isPaused, triggerSignOut, warningTimeoutMs]);

  const staySignedIn = useCallback(() => {
    setIsWarningOpen(false);
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    if (isPaused) {
      clearTimers();
      return;
    }

    startTimers();

    const handleActivity = () => {
      // Only reset timer if warning dialog is not already open
      if (!isWarningOpen) {
        startTimers();
      }
    };

    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    for (const evt of events) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const evt of events) {
        window.removeEventListener(evt, handleActivity);
      }
    };
  }, [clearTimers, isPaused, isWarningOpen, startTimers]);

  return {
    isWarningOpen,
    staySignedIn,
  };
}
