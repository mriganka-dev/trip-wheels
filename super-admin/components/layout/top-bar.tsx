"use client";

import React from "react";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TopBarProps {
  title?: string;
  userName?: string;
  unreadNotificationsCount?: number;
  onOpenMobileMenu?: () => void;
  onSignOut?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  userName = "Admin",
  unreadNotificationsCount = 0,
  onOpenMobileMenu,
  onSignOut,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 bg-surface border-b border-line flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 rounded text-ink-soft hover:text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-ink truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Notification bell, user name, sign out */}
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative p-2 rounded text-ink-soft hover:text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />
          )}
        </Link>

        <div className="hidden sm:flex items-center text-xs text-ink-soft">
          Signed in as <span className="font-medium text-ink ml-1">{userName}</span>
        </div>

        {onSignOut ? (
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={onSignOut}
          >
            Sign out
          </Button>
        ) : (
          <Link
            href="/login"
            className="text-xs text-ink-soft hover:text-ink font-medium px-2 py-1 rounded hover:bg-brand-tint"
          >
            Sign out
          </Link>
        )}
      </div>
    </header>
  );
};
