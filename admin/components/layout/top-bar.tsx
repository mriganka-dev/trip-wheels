"use client";

import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

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

      {/* Actions and Notification Bell Placeholder */}
      <div className="flex items-center gap-3">
        {actions}
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative flex items-center justify-center p-2 rounded-md text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper) transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-(--brand)"
        >
          <Bell className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
