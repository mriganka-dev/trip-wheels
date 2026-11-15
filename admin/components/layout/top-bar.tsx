"use client";

import React from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { NotificationBell } from "@/components/notifications/notification-bell";

export interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-(--line) bg-(--surface) flex items-center justify-between px-4 sm:px-8">
      {/* Mobile Title / Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="md:hidden">
          <Link href="/" className="flex items-baseline gap-1.5 focus-visible:outline-2 focus-visible:outline-(--brand) rounded">
            <span className="font-display text-lg font-bold text-(--ink) tracking-tight">
              {APP_NAME}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-(--brand)">
              Partner
            </span>
          </Link>
        </div>

        {title && (
          <div className="hidden md:flex flex-col min-w-0">
            <h1 className="text-lg font-bold font-display text-(--ink) truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-(--ink-soft) truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions and Notification Bell */}
      <div className="flex items-center gap-3">
        {actions}
        <NotificationBell />
      </div>
    </header>
  );
}
