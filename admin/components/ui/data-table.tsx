import React from "react";
import clsx from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No items to show.",
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-(--ink-soft) border border-(--line) bg-(--surface) rounded-md">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={clsx("w-full overflow-hidden rounded-md border border-(--line) bg-(--surface)", className)}>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-(--line) bg-(--paper)/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={clsx("px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line)">
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="transition-colors hover:bg-(--brand-tint)/10">
                {columns.map((col) => (
                  <td key={col.key} className={clsx("px-4 py-3.5 text-(--ink)", col.className)}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="divide-y divide-(--line) md:hidden">
        {data.map((item) => (
          <div key={keyExtractor(item)} className="p-4 flex flex-col gap-2">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-xs font-medium text-(--ink-soft) uppercase tracking-wider">
                  {col.header}
                </span>
                <span className="text-right text-(--ink)">
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
