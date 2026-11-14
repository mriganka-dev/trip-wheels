"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { BottomTabBar } from "./bottom-tab-bar";

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppShell({ children, title, subtitle, actions }: AppShellProps) {
  return (
    <div className="min-h-screen bg-(--paper) text-(--ink)">
      {/* Desktop fixed sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col md:pl-60">
        <TopBar title={title} subtitle={subtitle} actions={actions} />

        <main className="flex-1 pb-20 md:pb-8">
          <div className="mx-auto max-w-[1100px] p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
