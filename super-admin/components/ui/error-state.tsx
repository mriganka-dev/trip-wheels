import React from "react";
import { clsx } from "clsx";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center bg-surface border border-line rounded",
        className
      )}
    >
      <h3 className="text-base font-semibold text-negative">{title}</h3>
      <p className="text-sm text-ink-soft mt-1 max-w-md">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
