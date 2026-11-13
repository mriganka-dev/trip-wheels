import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { serverGetActiveDestinations } from "@/lib/api/destinations";
import { Container } from "@/components/layout/container";
import { MapPin, ArrowRight } from "lucide-react";
import type { Destination } from "@/types/destination";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse travel destinations across India with verified bike and car rentals.",
};

export default async function DestinationsIndexPage() {
  let destinations: Destination[] = [];
  try {
    destinations = await serverGetActiveDestinations();
  } catch {
    destinations = [];
  }

  return (
    <main className="py-12 bg-(--paper) min-h-screen">
      <Container>
        <div className="mb-8 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Coverage
          </span>
          <h1 className="mt-1 text-3xl font-bold font-display text-(--ink)">
            Travel destinations
          </h1>
          <p className="mt-2 text-sm text-(--ink-soft) leading-relaxed">
            Find bikes and cars in popular travel spots. Choose a destination to see available vehicles and pickup points.
          </p>
        </div>

        {destinations.length === 0 ? (
          <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center text-xs text-(--ink-soft)">
            No active destinations currently available. Please check back soon.
          </div>
        ) : (
          <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
            {destinations.map((destination) => {
              const landmarkNames = destination.landmarks
                ?.slice(0, 3)
                .map((lm) => lm.name)
                .join(", ");

              return (
                <div
                  key={destination.slug}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-(--paper)/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-(--brand)" />
                      <h2 className="font-display text-lg font-bold text-(--ink)">
                        <Link
                          href={`/destinations/${destination.slug}`}
                          className="hover:text-(--brand) focus:outline-hidden"
                        >
                          {destination.name}
                        </Link>
                      </h2>
                      <span className="text-xs text-(--ink-soft)">
                        ({destination.state})
                      </span>
                    </div>

                    {landmarkNames && (
                      <p className="mt-1.5 text-xs text-(--ink-soft) sm:pl-6">
                        Pickups near: {landmarkNames}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/destinations/${destination.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--brand) hover:text-(--brand-dark) sm:self-center"
                  >
                    <span>View vehicles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </main>
  );
}
