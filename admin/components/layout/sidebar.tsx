"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { APP_NAME } from "@/lib/constants";
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-(--line) bg-(--surface)">
      {/* Brand Wordmark */}
      <div className="h-16 flex items-center px-6 border-b border-(--line)">
        <Link href="/" className="flex items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-(--brand) rounded">
          <span className="font-display text-xl font-bold text-(--ink) tracking-tight">
            {APP_NAME}
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-(--brand)">
            Partner
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-between">
        <nav className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-(--ink-soft) px-3 py-1">
            Operations
          </div>
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                  active
                    ? "bg-(--brand-tint) text-(--brand-dark) font-semibold"
                    : "text-(--ink) hover:bg-(--paper) hover:text-(--ink)"
                )}
              >
                <Icon className={clsx("w-5 h-5", active ? "text-(--brand-dark)" : "text-(--ink-soft)")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="text-[11px] font-semibold uppercase tracking-wider text-(--ink-soft) px-3 pt-4 pb-1">
            Account & Records
          </div>
          {SECONDARY_NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[40px]",
                  active
                    ? "bg-(--brand-tint) text-(--brand-dark) font-semibold"
                    : "text-(--ink) hover:bg-(--paper) hover:text-(--ink)"
                )}
              >
                <Icon className={clsx("w-4 h-4", active ? "text-(--brand-dark)" : "text-(--ink-soft)")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="pt-4 mt-4 border-t border-(--line) px-3">
          <p className="text-xs text-(--ink-soft)">
            Signed in as owner
          </p>
        </div>
      </div>
    </aside>
  );
}
