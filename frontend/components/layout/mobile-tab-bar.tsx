"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarCheck, Bell, User } from "lucide-react";
import clsx from "clsx";

interface TabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { label: "Search", href: "/search", icon: Search },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Alerts", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-(--line) bg-(--surface) px-2 flex items-center justify-around"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/" && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors select-none",
              isActive
                ? "text-(--brand)"
                : "text-(--ink-soft) hover:text-(--ink)"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

