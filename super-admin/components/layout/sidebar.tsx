"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { clsx } from "clsx";

export interface NavItem {
  label: string;
  href: string;
  countKey?: "tasks" | "verifications" | "vehicles" | "issues";
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "Work",
    items: [
      { label: "Today", href: "/" },
      { label: "Tasks", href: "/tasks", countKey: "tasks" },
      { label: "Verifications", href: "/verifications", countKey: "verifications" },
      { label: "Vehicles", href: "/vehicles", countKey: "vehicles" },
      { label: "Issues", href: "/issues", countKey: "issues" },
    ],
  },
  {
    group: "Records",
    items: [
      { label: "Bookings", href: "/bookings" },
      { label: "Users", href: "/users" },
      { label: "Destinations", href: "/destinations" },
    ],
  },
  {
    group: "Insight",
    items: [
      { label: "Analytics", href: "/analytics" },
      { label: "Watchlists", href: "/watchlists" },
      { label: "Exports", href: "/exports" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Settings", href: "/settings" },
      { label: "Audit log", href: "/audit-log" },
    ],
  },
];

export interface SidebarProps {
  counts?: Partial<Record<"tasks" | "verifications" | "vehicles" | "issues", number>>;
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  counts = {},
  onNavigate,
  className,
}) => {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-full bg-surface border-r border-line select-none",
        className
      )}
    >
      {/* Brand header */}
      <div className="px-5 py-4 border-b border-line">
        <Link
          href="/"
          onClick={onNavigate}
          className="block group"
        >
          <span className="font-display font-semibold text-lg text-ink group-hover:text-brand transition-colors block">
            {APP_NAME}
          </span>
          <span className="text-xs text-ink-soft block mt-0.5">
            Super Admin Console
          </span>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-soft/80">
              {grp.group}
            </h4>
            <div className="space-y-0.5 pt-1">
              {grp.items.map((item) => {
                const active = isItemActive(item.href);
                const count = item.countKey ? counts[item.countKey] : undefined;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={clsx(
                      "flex items-center justify-between px-2.5 py-1.5 text-sm rounded transition-colors",
                      active
                        ? "bg-brand-tint text-brand font-medium"
                        : "text-ink hover:bg-brand-tint/40 hover:text-ink font-normal"
                    )}
                  >
                    <span>{item.label}</span>
                    {count !== undefined && count > 0 && (
                      <span
                        className={clsx(
                          "px-1.5 py-0.2 rounded text-xs",
                          active
                            ? "bg-brand text-white font-medium"
                            : "bg-paper text-ink-soft font-medium"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer info */}
      <div className="px-5 py-3 border-t border-line text-xs text-ink-soft">
        Platform Operations
      </div>
    </aside>
  );
};
