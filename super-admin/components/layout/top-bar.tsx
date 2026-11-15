"use client";

import React from "react";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export interface TopBarProps {
  title?: string;
  userName?: string;
  unreadNotificationsCount?: number;
  onOpenMobileMenu?: () => void;
  onSignOut?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  userName,
  unreadNotificationsCount = 0,
  onOpenMobileMenu,
  onSignOut,
}) => {
  const { user, logout } = useAuth();
  const displayName = userName || user?.fullName || "Admin";

  const handleSignOut = onSignOut || (() => logout());

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

      {/* Right: Notification bell, user profile link, sign out */}
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
          Signed in as{" "}
          <Link
            href="/profile"
            className="font-medium text-ink hover:text-brand underline underline-offset-2 ml-1"
          >
            {displayName}
          </Link>
        </div>

        <Button
          type="button"
          variant="quiet"
          size="sm"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
};
