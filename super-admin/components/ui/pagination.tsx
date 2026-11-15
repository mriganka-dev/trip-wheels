import React from "react";
import { clsx } from "clsx";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  limit,
  totalItems,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalItems <= 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-sm text-ink-soft",
        className
      )}
    >
      <div>
        Showing <span className="font-medium text-ink">{startItem}</span> to{" "}
        <span className="font-medium text-ink">{endItem}</span> of{" "}
        <span className="font-medium text-ink">{totalItems}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="text-xs text-ink px-1">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
