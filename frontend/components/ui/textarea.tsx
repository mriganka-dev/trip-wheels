import React from "react";
import clsx from "clsx";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border bg-(--surface) px-3 py-2 text-sm text-(--ink) placeholder:text-(--ink-soft)",
          "transition-colors disabled:cursor-not-allowed disabled:bg-(--paper) disabled:opacity-70",
          "focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-1",
          hasError ? "border-(--negative)" : "border-(--line)",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

