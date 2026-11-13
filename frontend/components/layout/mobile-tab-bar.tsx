"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, CalendarCheck, Bell, User } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/use-auth";
import { getNotifications } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";

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
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => getNotifications(1, 1),
    enabled: isAuthenticated,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const unreadCount = data?.unreadCount || 0;

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
        const isAlerts = tab.href === "/notifications";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors select-none relative",
              isActive
                ? "text-(--brand)"
                : "text-(--ink-soft) hover:text-(--ink)"
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {isAlerts && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-brand px-0.5 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

