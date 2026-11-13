import React from "react";
import clsx from "clsx";
import { Button } from "./button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-(--line) bg-(--surface)",
        className
      )}
    >
      <h3 className="text-base font-semibold text-(--ink) font-display">
        {title}
      </h3>
      <p className="mt-1 text-sm text-(--ink-soft) max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

