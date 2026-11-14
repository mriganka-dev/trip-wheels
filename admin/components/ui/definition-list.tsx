import React from "react";
import clsx from "clsx";

export interface DefinitionItem {
  key: string;
  label: string;
  value: React.ReactNode;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  className?: string;
}

export function DefinitionList({ items, className }: DefinitionListProps) {
  return (
    <dl className={clsx("divide-y divide-(--line)", className)}>
      {items.map((item) => (
        <div key={item.key} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
          <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
            {item.label}
          </dt>
          <dd className="text-sm font-medium text-(--ink) sm:text-right">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
