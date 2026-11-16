import React from "react";
import { clsx } from "clsx";

export interface InitialsAvatarProps {
  name?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name = "",
  src,
  size = "md",
  className,
}) => {
  const getInitials = (str: string): string => {
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses: Record<"sm" | "md" | "lg", string> = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (src) {
    return (
      <div
        className={clsx(
          "relative rounded-full overflow-hidden border border-line bg-surface shrink-0",
          sizeClasses[size],
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ? `${name} avatar` : "User avatar"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name || "User avatar"}
      className={clsx(
        "rounded-full bg-brand-tint text-brand border border-brand/20 font-semibold flex items-center justify-center shrink-0 select-none",
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
