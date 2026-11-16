import React from "react";
import { clsx } from "clsx";

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}) => {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
            {label}
            {required && <span className="text-negative ml-1">*</span>}
          </label>
        </div>
      )}
      {children}
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && <span className="text-xs text-negative font-medium">{error}</span>}
    </div>
  );
};
