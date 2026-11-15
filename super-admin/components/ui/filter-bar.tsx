"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  className,
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [prevSearchValue, setPrevSearchValue] = useState(searchValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  if (searchValue !== prevSearchValue) {
    setPrevSearchValue(searchValue);
    setLocalSearch(searchValue);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);

    if (onSearchChange) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearchChange(val);
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4",
        className
      )}
    >
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={handleChange}
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-9 pr-3 py-2 bg-surface text-ink text-sm rounded border border-line focus:outline-2 focus:outline-brand focus:border-brand placeholder:text-ink-soft/60"
          />
        </div>
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
};
