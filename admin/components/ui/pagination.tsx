import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination navigation"
      className={`flex items-center justify-between gap-4 py-4 ${className || ""}`}
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>

      <span className="text-xs text-(--ink-soft) font-medium">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </nav>
  );
}
