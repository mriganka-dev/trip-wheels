import React from "react";
import clsx from "clsx";

export type BadgeTone = "neutral" | "positive" | "negative" | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  const toneClasses = {
    neutral: "bg-(--paper) text-(--ink) border-(--line)",
    positive: "bg-(--brand-tint) text-(--brand-dark) border-(--brand)",
    negative: "bg-red-50 text-(--negative) border-red-200",
    warning: "bg-amber-50 text-(--warning) border-amber-200",
  }[tone];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-solid select-none",
        toneClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

