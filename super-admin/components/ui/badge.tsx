import React from "react";
import { clsx } from "clsx";
import type { StatusTone } from "@/lib/constants";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = "neutral",
  className,
  children,
  ...props
}) => {
  const toneClasses: Record<StatusTone, string> = {
    brand: "bg-brand-tint text-brand border-brand/30",
    warning: "bg-[#FEF6E9] text-warning border-warning/30",
    negative: "bg-[#FDF0EF] text-negative border-negative/30",
    neutral: "bg-surface text-ink-soft border-line",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border select-none",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
