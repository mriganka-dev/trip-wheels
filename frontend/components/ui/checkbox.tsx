import React from "react";
import clsx from "clsx";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hasError?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, hasError = false, disabled, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={clsx(
          "inline-flex items-center gap-2.5 text-sm select-none cursor-pointer",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          disabled={disabled}
          className={clsx(
            "h-4 w-4 rounded border bg-(--surface) text-(--brand)",
            "accent-(--brand) focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-2",
            hasError ? "border-(--negative)" : "border-(--line)",
            className
          )}
          {...props}
        />
        {label && <span className="text-(--ink)">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

