import React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border bg-(--surface) px-3 py-2.5 text-sm text-(--ink) placeholder:text-(--ink-soft) min-h-[44px]",
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

Input.displayName = "Input";
