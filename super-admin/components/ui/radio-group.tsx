import React from "react";
import { clsx } from "clsx";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  hint?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  defaultValue,
  onChange,
  className,
  disabled,
}) => {
  return (
    <div className={clsx("flex flex-col gap-2", className)} role="radiogroup">
      {options.map((opt) => {
        const optionId = `${name}-${opt.value}`;
        const isDisabled = disabled || opt.disabled;

        return (
          <div key={opt.value} className="flex items-start gap-2.5">
            <input
              type="radio"
              id={optionId}
              name={name}
              value={opt.value}
              checked={value !== undefined ? value === opt.value : undefined}
              defaultChecked={
                defaultValue !== undefined ? defaultValue === opt.value : undefined
              }
              onChange={onChange}
              disabled={isDisabled}
              className="mt-0.5 h-4 w-4 border-line accent-brand focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex flex-col">
              <label
                htmlFor={optionId}
                className={clsx(
                  "text-sm font-medium text-ink select-none cursor-pointer",
                  isDisabled && "cursor-not-allowed opacity-50"
                )}
              >
                {opt.label}
              </label>
              {opt.hint && <span className="text-xs text-ink-soft mt-0.5">{opt.hint}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
