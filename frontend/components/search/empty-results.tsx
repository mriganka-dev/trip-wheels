import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SearchSuggestions } from "@/types/vehicle";

export interface EmptyResultsProps {
  destinationName: string;
  suggestions?: SearchSuggestions;
  from?: string;
  to?: string;
  onResetFilters: () => void;
}

export function EmptyResults({
  destinationName,
  suggestions,
  from,
  to,
  onResetFilters,
}: EmptyResultsProps) {
  const nearby = suggestions?.nearbyDestinations || [];
  const joytrips = suggestions?.joytrips;

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center space-y-6">
      <div className="max-w-md mx-auto">
        <h3 className="font-display text-lg font-bold text-(--ink)">
          No vehicles available for these dates
        </h3>
        <p className="mt-2 text-xs text-(--ink-soft) leading-relaxed">
          There are currently no active bikes or cars matching your exact criteria in {destinationName}. Try adjusting your pickup dates or clearing your filters.
        </p>

        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onResetFilters}>
            Clear filters
          </Button>
        </div>
      </div>

      {nearby.length > 0 && (
        <div className="border-t border-(--line) pt-6 max-w-lg mx-auto">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-(--ink-soft) mb-3">
            Nearby destinations with rentals
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nearby.map((dest) => {
              const query = new URLSearchParams({
                destination: dest.slug,
              });
              if (from) query.set("from", from);
              if (to) query.set("to", to);

              return (
                <Link
                  key={dest.slug}
                  href={`/search?${query.toString()}`}
                  className="inline-flex items-center rounded-md border border-(--line) bg-(--paper) px-3 py-1.5 text-xs font-medium text-(--ink) hover:border-(--brand) hover:text-(--brand) transition-colors"
                >
                  {dest.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {joytrips?.url && (
        <div className="border-t border-(--line) pt-6 max-w-md mx-auto text-xs text-(--ink-soft)">
          <p>
            Looking for other trips near {destinationName}?{" "}
            <a
              href={joytrips.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-(--brand) hover:text-(--brand-dark) underline underline-offset-2"
            >
              See ideas on JoyTrips
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}

