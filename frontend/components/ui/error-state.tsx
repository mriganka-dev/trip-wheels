import React from "react";
import clsx from "clsx";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center rounded-md border border-(--line) bg-(--surface)",
        className
      )}
    >
      <h3 className="text-base font-semibold text-(--negative) font-display">
        {title}
      </h3>
      <p className="mt-1 text-sm text-(--ink-soft) max-w-sm">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

