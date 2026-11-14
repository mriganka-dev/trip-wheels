import React from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-(--paper)">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-(--brand) rounded p-1"
          >
            <span className="font-display text-2xl font-bold text-(--ink) tracking-tight">
              {APP_NAME}
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-(--brand)">
              Partner
            </span>
          </Link>
          <p className="mt-1 text-xs text-(--ink-soft)">
            Dashboard for rental agents and individual owners
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8 shadow-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
