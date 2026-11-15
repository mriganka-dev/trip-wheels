import React from "react";
import { clsx } from "clsx";

export interface StickyActionBarProps {
  children: React.ReactNode;
  info?: React.ReactNode;
  className?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  children,
  info,
  className,
}) => {
  return (
    <div
      className={clsx(
        "sticky bottom-0 z-30 -mx-4 -mb-6 mt-8 sm:-mx-6 sm:-mb-8 px-4 sm:px-6 py-3",
        "bg-surface border-t border-line shadow-sm",
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3",
        className
      )}
    >
      {info ? (
        <div className="text-xs text-ink-soft">{info}</div>
      ) : (
        <div className="text-xs text-ink-soft">Actions are recorded in the audit log</div>
      )}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {children}
      </div>
    </div>
  );
};
