"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> {
  checked?: boolean | "indeterminate"
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCheckedChange?: (checked: boolean) => void
  label?: React.ReactNode
  hint?: string
  hasError?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, hint, hasError, id, disabled, checked, onChange, onCheckedChange, ...props },
  ref
) {
  const generatedId = React.useId()
  const inputId = id || generatedId

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input
        id={inputId}
        ref={ref}
        type="checkbox"
        disabled={disabled}
        checked={typeof checked === "boolean" ? checked : undefined}
        onChange={(e) => {
          onChange?.(e)
          onCheckedChange?.(e.target.checked)
        }}
        className={cn(
          "mt-0.5 h-4 w-4 rounded border accent-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          hasError ? "border-destructive" : "border-input",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        )}
        {...props}
      />
      {label && (
        <div className="flex flex-col">
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-foreground select-none cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
          </label>
          {hint && <span className="text-xs text-muted-foreground mt-0.5">{hint}</span>}
        </div>
      )}
    </div>
  )
})

Checkbox.displayName = "Checkbox"

export { Checkbox }
