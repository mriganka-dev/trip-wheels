import React from "react";
import clsx from "clsx";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError = false, disabled, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border bg-(--surface) px-3 py-2 text-sm text-(--ink)",
          "transition-colors disabled:cursor-not-allowed disabled:bg-(--paper) disabled:opacity-70",
          "focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-1",
          hasError ? "border-(--negative)" : "border-(--line)",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

