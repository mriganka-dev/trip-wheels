import React from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Container } from "./container";

export function Footer() {
  return (
    <footer className="w-full border-t border-(--line) bg-(--surface) py-10 mt-auto text-sm text-(--ink-soft)">
      <Container>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="max-w-sm">
            <span className="font-display font-bold text-base text-(--brand)">
              {APP_NAME}
            </span>
            <p className="mt-2 text-xs text-(--ink-soft) leading-relaxed">
              Bikes and cars at travel destinations across India from local rental shops and verified individual owners. Pay the owner directly at vehicle pickup.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-12 text-xs">
            <div className="flex flex-col gap-2">
              <span className="font-semibold uppercase tracking-wider text-(--ink)">
                Explore
              </span>
              <Link href="/destinations" className="hover:text-(--ink) transition-colors">
                Destinations
              </Link>
              <Link href="/how-it-works" className="hover:text-(--ink) transition-colors">
                How it works
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-semibold uppercase tracking-wider text-(--ink)">
                Support
              </span>
              <Link href="/help" className="hover:text-(--ink) transition-colors">
                Help
              </Link>
              <Link href="/terms" className="hover:text-(--ink) transition-colors">
                Terms of use
              </Link>
              <Link href="/privacy" className="hover:text-(--ink) transition-colors">
                Privacy policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-(--line) flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-(--ink-soft)">
            Prices are informational. Documents required at handover.
          </p>
        </div>
      </Container>
    </footer>
  );
}

