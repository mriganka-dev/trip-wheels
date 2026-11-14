"use client";

import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={clsx(
        "inline-flex items-center gap-1 border-b border-(--line) w-full bg-transparent p-0",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={clsx(
        "inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-(--ink-soft) min-h-[44px]",
        "border-b-2 border-transparent transition-colors cursor-pointer",
        "hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-2",
        "data-[state=active]:border-(--brand) data-[state=active]:text-(--brand)",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: TabsPrimitive.TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={clsx(
        "pt-4 focus-visible:outline-2 focus-visible:outline-(--brand)",
        className
      )}
      {...props}
    />
  );
}
