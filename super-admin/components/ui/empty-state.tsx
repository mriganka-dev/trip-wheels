import React from "react";
import { clsx } from "clsx";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center bg-surface border border-line rounded",
        className
      )}
    >
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
