"use client"

import * as React from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "@/lib/utils"

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  hint?: string;
  disabled?: boolean;
}

export interface DualRadioGroupProps {
  name?: string;
  options?: RadioOption[];
  value?: any;
  defaultValue?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function RadioGroup({
  className,
  options,
  name = "radio-group",
  value,
  defaultValue,
  onChange,
  disabled,
  children,
  ...props
}: DualRadioGroupProps & any) {
  if (options) {
    return (
      <div className={cn("flex flex-col gap-2", className)} role="radiogroup">
        {options.map((opt: RadioOption) => {
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
                className="mt-0.5 h-4 w-4 border-input accent-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex flex-col">
                <label
                  htmlFor={optionId}
                  className={cn(
                    "text-sm font-medium text-foreground select-none cursor-pointer",
                    isDisabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {opt.label}
                </label>
                {opt.hint && <span className="text-xs text-muted-foreground mt-0.5">{opt.hint}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("cn-radio-group grid w-full gap-2", className)}
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      {children}
    </RadioGroupPrimitive>
  )
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "cn-radio-group-item group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="cn-radio-group-indicator flex size-4 items-center justify-center"
      >
        <span className="cn-radio-group-indicator-icon absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
