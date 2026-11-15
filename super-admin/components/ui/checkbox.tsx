import React from "react";
import { clsx } from "clsx";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  hint?: string;
  hasError?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, hasError, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={clsx("flex items-start gap-2.5", className)}>
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={clsx(
            "mt-0.5 h-4 w-4 rounded border accent-brand focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2",
            hasError ? "border-negative" : "border-line",
            "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          )}
          {...props}
        />
        {label && (
          <div className="flex flex-col">
            <label
              htmlFor={inputId}
              className={clsx(
                "text-sm font-medium text-ink select-none cursor-pointer",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
            {hint && <span className="text-xs text-ink-soft mt-0.5">{hint}</span>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
