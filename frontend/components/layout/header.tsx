"use client";

import React from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Container } from "./container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-(--line) bg-(--surface)">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-(--brand) hover:text-(--brand-dark) select-none"
          >
            {APP_NAME}
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden sm:flex items-center gap-6 text-sm font-medium"
          >
            <Link
              href="/destinations"
              className="text-(--ink-soft) hover:text-(--ink) transition-colors"
            >
              Destinations
            </Link>
            <Link
              href="/how-it-works"
              className="text-(--ink-soft) hover:text-(--ink) transition-colors"
            >
              How it works
            </Link>
            {isAuthenticated && (
              <Link
                href="/bookings"
                className="text-(--ink-soft) hover:text-(--ink) transition-colors"
              >
                My Bookings
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-20 rounded bg-(--line)/40 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-xs font-semibold text-(--ink) hover:text-(--brand)"
                >
                  <Avatar name={user.fullName} size="sm" src={user.avatar?.url} />
                  <span className="hidden sm:inline-block max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                </Link>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-sm font-medium px-3.5 py-1.5 rounded-md border border-(--line) bg-(--surface) text-(--ink) hover:border-(--ink-soft) transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
