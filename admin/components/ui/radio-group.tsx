import React from "react";
import clsx from "clsx";

export interface RadioOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  hasError?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  defaultValue,
  onChange,
  hasError = false,
  className,
}: RadioGroupProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {options.map((option) => {
        const isChecked = value !== undefined ? value === option.value : undefined;
        return (
          <label
            key={option.value}
            className={clsx(
              "inline-flex items-start gap-3 p-3 rounded-md border bg-(--surface) cursor-pointer select-none transition-colors min-h-[44px]",
              option.disabled && "cursor-not-allowed opacity-60",
              hasError
                ? "border-(--negative)"
                : isChecked
                ? "border-(--brand) bg-(--brand-tint)/20"
                : "border-(--line) hover:border-(--ink-soft)"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isChecked}
              defaultChecked={defaultValue === option.value}
              disabled={option.disabled}
              onChange={() => onChange?.(option.value)}
              className="mt-0.5 h-4 w-4 accent-(--brand) focus-visible:outline-2 focus-visible:outline-(--brand)"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-(--ink)">{option.label}</span>
              {option.hint && (
                <span className="text-xs text-(--ink-soft) mt-0.5">{option.hint}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
