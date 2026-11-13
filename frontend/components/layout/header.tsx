import React from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Container } from "./container";

export function Header() {
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
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center text-sm font-medium px-3.5 py-1.5 rounded-md border border-(--line) bg-(--surface) text-(--ink) hover:border-(--ink-soft) transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

