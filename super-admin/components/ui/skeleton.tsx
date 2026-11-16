import React from "react";
import { clsx } from "clsx";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        "animate-pulse rounded bg-line/60",
        className
      )}
      {...props}
    />
  );
};
