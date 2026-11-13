"use client";

import React, { useEffect, useState } from "react";
import { formatTime } from "@/lib/format";

interface ResponseCountdownProps {
  deadline: string;
}

interface TimeRemaining {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateRemaining(deadlineStr: string): TimeRemaining {
  const deadlineDate = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      totalSeconds: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

export function ResponseCountdown({ deadline }: ResponseCountdownProps) {
  const [remaining, setRemaining] = useState<TimeRemaining>(() =>
    calculateRemaining(deadline)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(calculateRemaining(deadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const formattedTime = formatTime(deadline);

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-paper-light border border-line p-2 text-brand shrink-0">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-serif text-base font-bold text-ink">
            The owner has until {formattedTime} to reply
          </h3>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            Owners are asked to respond within the deadline. If the owner does not reply before the deadline, your request will expire and no charges will apply.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-paper-light border border-line px-3.5 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Time remaining:
            </span>
            {remaining.isExpired ? (
              <span className="text-sm font-semibold text-rose-700">
                Deadline passed (awaiting expiration)
              </span>
            ) : (
              <span className="font-mono text-sm font-bold text-ink" aria-live="polite">
                {remaining.hours > 0 ? `${remaining.hours}h ` : ""}
                {remaining.minutes}m {remaining.seconds.toString().padStart(2, "0")}s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

