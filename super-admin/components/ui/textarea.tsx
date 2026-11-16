import React from "react";
import { clsx } from "clsx";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          "w-full px-3 py-2 bg-surface text-ink text-sm rounded border",
          hasError
            ? "border-negative focus:outline-negative focus:border-negative"
            : "border-line focus:outline-brand focus:border-brand",
          "placeholder:text-ink-soft/60 focus:outline-2 focus:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-y",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
