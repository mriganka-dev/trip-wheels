import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { serverGetDestinationBySlug, serverGetActiveDestinations } from "@/lib/api/destinations";
import { getComingWeekendDates } from "@/lib/format";
import { Container } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";
import { MapPin, Calendar } from "lucide-react";

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const destination = await serverGetDestinationBySlug(slug);
    return {
      title: `Bike and car rental in ${destination.name}`,
      description: `Rent bikes and cars in ${destination.name}, ${destination.state}. Request vehicles from verified local shops and owners with direct payment at pickup.`,
    };
  } catch {
    return {
      title: "Destination not found",
    };
  }
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;

  let destination;
  let allDestinations;

  try {
    [destination, allDestinations] = await Promise.all([
      serverGetDestinationBySlug(slug),
      serverGetActiveDestinations(),
    ]);
  } catch {
    notFound();
  }

  const weekend = getComingWeekendDates();
  const weekendSearchHref = `/search?destination=${destination.slug}&from=${encodeURIComponent(
    weekend.from
  )}&to=${encodeURIComponent(weekend.to)}`;

  // Check if real photo was supplied on disk
  const photoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "destinations",
    `${destination.slug}.jpg`
  );
  const hasRealPhoto = fs.existsSync(photoPath);

  return (
    <main className="py-10 bg-(--paper) min-h-screen">
      <Container>
        <div className="mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--brand)">
              <MapPin className="w-4 h-4" />
              <span>
                {destination.state}, {destination.country}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-(--ink)">
              Bike and car rental in {destination.name}
            </h1>
            <p className="text-sm text-(--ink-soft) max-w-2xl leading-relaxed">
              Find verified two wheelers and cars from local rental shops and individual owners in {destination.name}. Pay directly when you pick up the vehicle.
            </p>
          </div>
        </div>

        {hasRealPhoto && (
          <div className="mb-8 overflow-hidden rounded-md border border-(--line) relative h-64 sm:h-80 w-full bg-(--surface)">
            <Image
              src={`/images/destinations/${destination.slug}.jpg`}
              alt={`${destination.name}, ${destination.state}`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        )}

        {/* Preselected search form */}
        <div className="mb-10">
          <SearchForm
            initialDestination={destination.slug}
            destinations={allDestinations}
          />
        </div>

        {/* Quick action for upcoming weekend */}
        <div className="mb-12 rounded-md border border-(--line) bg-(--surface) p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-(--brand-tint) text-(--brand-dark) shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-(--ink)">
                Planning for the coming weekend?
              </h3>
              <p className="text-xs text-(--ink-soft)">
                Quickly browse all bikes and cars available from this Saturday morning to Sunday evening.
              </p>
            </div>
          </div>
          <Link
            href={weekendSearchHref}
            className="inline-flex items-center justify-center font-medium rounded-md px-4 py-2 text-xs bg-(--brand) text-white hover:bg-(--brand-dark) transition-colors shrink-0"
          >
            Check weekend availability
          </Link>
        </div>

        {/* Landmarks and pickup points */}
        {destination.landmarks && destination.landmarks.length > 0 && (
          <div className="rounded-md border border-(--line) bg-(--surface) p-6 mb-12">
            <h2 className="font-display text-lg font-bold text-(--ink) mb-4">
              Main pickup landmarks in {destination.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {destination.landmarks.map((landmark) => (
                <div
                  key={landmark._id}
                  className="rounded-md border border-(--line) bg-(--paper) p-3"
                >
                  <span className="text-xs font-semibold text-(--ink) block">
                    {landmark.name}
                  </span>
                  <span className="text-[11px] text-(--ink-soft) capitalize block mt-1">
                    {landmark.type.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Travel & document notice */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-6">
          <h2 className="font-display text-base font-bold text-(--ink) mb-2">
            Rental requirements in {destination.name}
          </h2>
          <p className="text-xs text-(--ink-soft) leading-relaxed">
            All rentals require an original valid Indian driving license and a government ID (such as Aadhaar, Voter ID or Passport). You inspect the vehicle and pay the owner directly at pickup. No online payment is collected on this platform.
          </p>
        </div>
      </Container>
    </main>
  );
}

