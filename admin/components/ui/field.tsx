import React from "react";
import clsx from "clsx";

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold uppercase tracking-wider text-(--ink-soft)"
        >
          {label}
          {required && <span className="ml-1 text-(--negative)">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-(--ink-soft)">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-(--negative)">
          {error}
        </p>
      )}
    </div>
  );
}
