"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MenuSheet, MenuSheetContent } from "@/components/ui/menu-sheet";

export interface AppShellProps {
  title?: string;
  contextLine?: string;
  userName?: string;
  unreadNotificationsCount?: number;
  counts?: Partial<Record<"tasks" | "verifications" | "vehicles" | "issues", number>>;
  onSignOut?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  title,
  contextLine,
  userName,
  unreadNotificationsCount,
  counts,
  onSignOut,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      {/* Desktop fixed sidebar */}
      <div className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar counts={counts} />
      </div>

      {/* Mobile sheet navigation */}
      <MenuSheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <MenuSheetContent side="left" title="Trip Wheels Super Admin">
          <Sidebar
            counts={counts}
            onNavigate={() => setMobileMenuOpen(false)}
            className="border-none"
          />
        </MenuSheetContent>
      </MenuSheet>

      {/* Main content column with offset for desktop sidebar */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <TopBar
          title={title}
          userName={userName}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSignOut={onSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {contextLine && (
            <p className="text-sm text-ink-soft mb-4">{contextLine}</p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
