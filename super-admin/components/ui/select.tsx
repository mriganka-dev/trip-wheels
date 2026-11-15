import React from "react";
import { clsx } from "clsx";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, options, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={clsx(
          "w-full h-10 px-3 py-2 bg-surface text-ink text-sm rounded border",
          hasError
            ? "border-negative focus:outline-negative focus:border-negative"
            : "border-line focus:outline-brand focus:border-brand",
          "focus:outline-2 focus:outline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

Select.displayName = "Select";
