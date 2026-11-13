import React from "react";
import clsx from "clsx";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "narrow" | "default" | "wide";
}

export function Container({
  children,
  className,
  size = "default",
  ...props
}: ContainerProps) {
  const sizeClasses = {
    narrow: "max-w-3xl",
    default: "max-w-5xl",
    wide: "max-w-7xl",
  }[size];

  return (
    <div
      className={clsx("w-full mx-auto px-4 sm:px-6", sizeClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
}

