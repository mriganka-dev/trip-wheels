"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { clsx } from "clsx";

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = "Copy",
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback or ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : `${label} to clipboard`}
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-line bg-surface text-ink-soft hover:text-ink hover:bg-brand-tint transition-colors focus-visible:outline-2 focus-visible:outline-brand cursor-pointer",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-brand" />
          <span className="text-brand font-medium">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
