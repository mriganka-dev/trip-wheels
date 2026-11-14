"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Calendar, Car, Home, LogOut, Menu } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/use-auth";
import { BottomSheet, BottomSheetContent } from "@/components/ui/bottom-sheet";
import { SECONDARY_NAV_ITEMS } from "./nav-items";

export function BottomTabBar() {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bookings", label: "Bookings", icon: Calendar },
    { href: "/vehicles", label: "Vehicles", icon: Car },
    { href: "/notifications", label: "Alerts", icon: Bell },
  ];

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-(--line) bg-(--surface)"
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const active = isTabActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                  active ? "text-(--brand) font-semibold" : "text-(--ink-soft) hover:text-(--ink)"
                )}
              >
                <Icon className={clsx("w-5 h-5", active ? "text-(--brand)" : "text-(--ink-soft)")} />
                <span className="text-[11px] leading-none">{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-(--ink-soft) hover:text-(--ink) transition-colors min-h-[44px] cursor-pointer"
            aria-label="Open more navigation options"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* More Options Sheet */}
      <BottomSheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <BottomSheetContent title="More options" description="Account, records and settings">
          <div className="divide-y divide-(--line) -mx-2">
            {SECONDARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3.5 text-sm font-medium text-(--ink) hover:bg-(--paper) transition-colors min-h-[44px]"
                >
                  <Icon className="w-5 h-5 text-(--ink-soft)" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                logout();
              }}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-3 py-3.5 text-sm font-medium text-(--negative) hover:bg-red-50 transition-colors min-h-[44px] text-left cursor-pointer disabled:opacity-60"
            >
              <LogOut className="w-5 h-5 text-(--negative)" />
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
