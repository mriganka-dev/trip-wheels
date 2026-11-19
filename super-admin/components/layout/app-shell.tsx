"use client";

import React from "react";

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
  children,
}) => {
  return (
    <div className="w-full space-y-4">
      {(title || contextLine) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 pb-3 mb-2 border-b border-border">
          <div>
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {contextLine && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {contextLine}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="w-full">{children}</div>
    </div>
  );
};
