import React from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-2";

    const variantClasses = {
      primary: "bg-(--brand) text-white hover:bg-(--brand-dark) active:bg-(--brand-dark)",
      secondary:
        "bg-(--surface) text-(--ink) border border-(--line) hover:border-(--ink-soft) active:bg-(--paper)",
      quiet: "bg-transparent text-(--ink) hover:bg-(--brand-tint) active:bg-(--brand-tint)",
      danger:
        "bg-(--negative) text-white hover:opacity-90 active:opacity-95",
    }[variant];

    const sizeClasses = {
      sm: "text-xs px-3 py-1.5 min-h-[36px] gap-1.5",
      md: "text-sm px-4 py-2.5 min-h-[44px] gap-2",
      lg: "text-base px-5 py-3 min-h-[48px] gap-2.5",
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={clsx(baseClasses, variantClasses, sizeClasses, className)}
        {...props}
      >
        {isLoading ? "Please wait..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";
