import React from "react";
import { clsx } from "clsx";

export interface DefinitionItemData {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

export interface DefinitionListProps {
  items?: DefinitionItemData[];
  children?: React.ReactNode;
  className?: string;
}

export const DefinitionList: React.FC<DefinitionListProps> = ({
  items,
  children,
  className,
}) => {
  return (
    <dl
      className={clsx(
        "divide-y divide-line text-sm",
        className
      )}
    >
      {items
        ? items.map((item, idx) => (
            <div key={idx} className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-ink-soft font-medium">{item.label}</dt>
              <dd className="mt-1 text-ink sm:col-span-2 sm:mt-0 font-normal">
                {item.value}
                {item.hint && <span className="block text-xs text-ink-soft mt-0.5">{item.hint}</span>}
              </dd>
            </div>
          ))
        : children}
    </dl>
  );
};

export interface DefinitionItemProps {
  label: string;
  value?: React.ReactNode;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
}

export const DefinitionItem: React.FC<DefinitionItemProps> = ({
  label,
  value,
  hint,
  children,
  className,
}) => {
  return (
    <div className={clsx("py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline", className)}>
      <dt className="text-ink-soft font-medium">{label}</dt>
      <dd className="mt-1 text-ink sm:col-span-2 sm:mt-0 font-normal">
        {value ?? children}
        {hint && <span className="block text-xs text-ink-soft mt-0.5">{hint}</span>}
      </dd>
    </div>
  );
};
