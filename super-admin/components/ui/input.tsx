import React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={clsx(
          "w-full h-10 px-3 py-2 bg-surface text-ink text-sm rounded border",
          hasError
            ? "border-negative focus:outline-negative focus:border-negative"
            : "border-line focus:outline-brand focus:border-brand",
          "placeholder:text-ink-soft/60 focus:outline-2 focus:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
