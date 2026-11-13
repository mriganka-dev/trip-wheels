import React from "react";
import Image from "next/image";
import clsx from "clsx";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: AvatarProps) {
  const sizeMap = {
    sm: { dimension: 32, class: "w-8 h-8 text-xs" },
    md: { dimension: 40, class: "w-10 h-10 text-sm" },
    lg: { dimension: 48, class: "w-12 h-12 text-base" },
  }[size];

  if (src) {
    return (
      <div
        className={clsx(
          "relative overflow-hidden rounded-full border border-(--line) bg-(--paper)",
          sizeMap.class,
          className
        )}
      >
        <Image
          src={src}
          alt={name}
          width={sizeMap.dimension}
          height={sizeMap.dimension}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-(--brand-tint) font-semibold text-(--brand-dark) select-none border border-(--line)",
        sizeMap.class,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

