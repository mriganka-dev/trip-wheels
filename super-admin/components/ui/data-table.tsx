import React from "react";
import { clsx } from "clsx";
import { Skeleton } from "./skeleton";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  isPrimary?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No items to show.",
  isLoading = false,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={clsx("w-full bg-surface border border-line rounded overflow-hidden p-4 space-y-3", className)}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={clsx("p-8 text-center text-sm text-ink-soft border border-line bg-surface rounded", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={clsx("w-full bg-surface border border-line rounded overflow-hidden", className)}>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={clsx(
                    "px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ink-soft",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-brand-tint/20 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={clsx("px-4 py-3 text-ink", col.className)}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="divide-y divide-line md:hidden">
        {data.map((item) => {
          const primaryCol = columns.find((c) => c.isPrimary) || columns[0];
          const otherCols = columns.filter((c) => c !== primaryCol);

          return (
            <div key={keyExtractor(item)} className="p-4 flex flex-col gap-2">
              {primaryCol && (
                <div className="font-medium text-ink text-sm pb-1 border-b border-line/40">
                  {primaryCol.render
                    ? primaryCol.render(item)
                    : String((item as Record<string, unknown>)[primaryCol.key] ?? "")}
                </div>
              )}
              {otherCols.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2 text-xs">
                  <span className="text-ink-soft font-medium uppercase tracking-wider">
                    {col.header}
                  </span>
                  <span className="text-right text-ink font-normal">
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
