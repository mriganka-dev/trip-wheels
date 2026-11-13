"use client";

import React, { useState } from "react";
import { formatPhone, getTelLink } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface OwnerContactProps {
  ownerName: string;
  phone: string;
}

export function OwnerContact({ ownerName, phone }: OwnerContactProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Owner Contact
          </span>
          <h3 className="mt-1 font-serif text-lg font-bold text-ink">
            {ownerName}
          </h3>
          <p className="mt-0.5 font-mono text-base font-semibold text-brand">
            {formatPhone(phone)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Call the owner to discuss pickup time, location specifics, or any questions.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={getTelLink(phone)}>
            <Button size="sm" variant="primary" className="w-full">
              <svg
                className="mr-1.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call
            </Button>
          </a>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="w-full"
          >
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copied ? "Copied" : "Copy number"}
          </Button>
        </div>
      </div>
    </div>
  );
}

