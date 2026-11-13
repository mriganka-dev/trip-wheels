import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { serverGetVehicleDetail } from "@/lib/api/vehicles";
import { formatCurrency } from "@/lib/format";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { VehicleGallery } from "@/components/vehicle/vehicle-gallery";
import { VehicleSpecs } from "@/components/vehicle/vehicle-specs";
import { VehicleReviews } from "@/components/vehicle/vehicle-reviews";
import { BookingPanel } from "@/components/vehicle/booking-panel";
import { Map } from "@/components/maps/map";
import {
  Star,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Clock,
  CircleDollarSign,
} from "lucide-react";

interface VehiclePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export async function generateMetadata({
  params,
}: VehiclePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const vehicle = await serverGetVehicleDetail(id);
    const destName =
      typeof vehicle.destination === "object"
        ? vehicle.destination.name
        : "Destination";

    return {
      title: `${vehicle.brand} ${vehicle.model} for rent in ${destName}`,
      description: `Rent a ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.type}) in ${destName} starting at ${formatCurrency(
        vehicle.pricing.perDay
      )} per day. Verified owner with direct payment at vehicle pickup.`,
    };
  } catch {
    return {
      title: "Vehicle details",
    };
  }
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: VehiclePageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;

  let vehicle;
  try {
    vehicle = await serverGetVehicleDetail(id);
  } catch {
    notFound();
  }

  const destinationName =
    typeof vehicle.destination === "object"
      ? vehicle.destination.name
      : "Destination";
  const destinationSlug =
    typeof vehicle.destination === "object" ? vehicle.destination.slug : "";

  const isAgent = vehicle.publisherProfile?.publisherType === "agent";
  const publisherName = vehicle.publisher?.fullName || "Verified Publisher";
  const hasRating =
    typeof vehicle.ratingAvg === "number" && vehicle.ratingAvg > 0;

  // Extract coordinates for agent pickup map if present
  let mapCoords: { lat: number; lng: number } | null = null;
  const coords = (vehicle.pickup as { location?: { coordinates?: [number, number] } })?.location?.coordinates;
  if (coords && Array.isArray(coords) && coords.length === 2) {
    mapCoords = { lat: coords[1], lng: coords[0] };
  }

  const pickupAddress =
    vehicle.pickup?.address ||
    vehicle.publisherProfile?.agentPickup?.address ||
    "Pickup point in destination";

  const directionsUrl = mapCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${mapCoords.lat},${mapCoords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${pickupAddress}, ${destinationName}`
      )}`;

  // Structured Data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
    description: `${vehicle.type.toUpperCase()} rental in ${destinationName}`,
    image: vehicle.images?.[0]?.url,
    offers: {
      "@type": "Offer",
      price: vehicle.pricing.perDay,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="py-8 sm:py-12 bg-(--paper) min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Container>
        {/* Breadcrumb path */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs text-(--ink-soft)"
        >
          <Link href="/" className="hover:text-(--ink)">
            Home
          </Link>
          <span>/</span>
          {destinationSlug ? (
            <>
              <Link
                href={`/destinations/${destinationSlug}`}
                className="hover:text-(--ink)"
              >
                {destinationName}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-(--ink) font-medium truncate">
            {vehicle.brand} {vehicle.model}
          </span>
        </nav>

        {/* Top Title Block */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge tone="neutral" className="uppercase text-xs font-semibold">
              {vehicle.type}
            </Badge>
            <Badge tone="positive" className="text-xs">
              Verified {isAgent ? "Rental Shop" : "Owner"}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold font-display text-(--ink)">
            {vehicle.brand} {vehicle.model} ({vehicle.year})
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-(--ink-soft)">
            <div className="flex items-center gap-1.5 font-medium text-(--ink)">
              <ShieldCheck className="w-4 h-4 text-(--brand)" />
              <span>{publisherName}</span>
            </div>

            {hasRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-(--warning) text-(--warning)" />
                <span className="font-semibold text-(--ink)">
                  {vehicle.ratingAvg?.toFixed(1)}
                </span>
                <span>({vehicle.ratingCount || 0} reviews)</span>
              </div>
            )}

            {vehicle.tripsCompleted ? (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-(--ink-soft)" />
                <span>{vehicle.tripsCompleted} trips completed</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-(--brand)" />
              <span>{destinationName}</span>
            </div>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2/3): Gallery and Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Gallery */}
            <VehicleGallery
              images={vehicle.images}
              title={`${vehicle.brand} ${vehicle.model}`}
            />

            {/* 2. Specifications */}
            <VehicleSpecs vehicle={vehicle} />

            {/* 3. Pricing and Direct Payment Note */}
            <div className="rounded-md border border-(--line) bg-(--surface) p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--brand) mb-2">
                <CircleDollarSign className="w-4 h-4" />
                <span>Transparent Rates</span>
              </div>
              <h2 className="font-display text-lg font-bold text-(--ink) mb-3">
                Rental pricing & payment
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-md bg-(--paper) border border-(--line)">
                  <span className="text-xs text-(--ink-soft) block">Daily rate</span>
                  <span className="font-display text-2xl font-bold text-(--brand)">
                    {formatCurrency(vehicle.pricing.perDay)}
                  </span>
                  <span className="text-xs text-(--ink-soft)"> / day</span>
                </div>

                {vehicle.pricing.perHour ? (
                  <div className="p-4 rounded-md bg-(--paper) border border-(--line)">
                    <span className="text-xs text-(--ink-soft) block">Hourly rate</span>
                    <span className="font-display text-2xl font-bold text-(--brand)">
                      {formatCurrency(vehicle.pricing.perHour)}
                    </span>
                    <span className="text-xs text-(--ink-soft)"> / hour</span>
                  </div>
                ) : null}
              </div>

              {vehicle.pricing.deposit ? (
                <p className="text-xs text-(--ink-soft) mb-3">
                  <strong>Security deposit:</strong> {formatCurrency(vehicle.pricing.deposit)} (refundable upon return in original condition).
                </p>
              ) : null}

              <div className="rounded-md border border-(--line) bg-(--brand-tint)/40 p-3.5 text-xs text-(--ink) leading-relaxed">
                <strong>Pay at pickup:</strong> You pay the owner directly when you inspect and collect the vehicle. There is no online payment, convenience fee or card charge on this website.
              </div>
            </div>

            {/* 4. What to carry */}
            <div className="rounded-md border border-(--line) bg-(--surface) p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--brand) mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Handover Requirements</span>
              </div>
              <h2 className="font-display text-lg font-bold text-(--ink) mb-3">
                What to carry to pickup
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-(--ink) list-disc pl-5 mb-3 leading-relaxed">
                <li>
                  <strong>Valid Driving License:</strong> Original physical license for this vehicle type.
                </li>
                <li>
                  <strong>Government ID Proof:</strong> Original Aadhaar card, Voter ID or Passport.
                </li>
              </ul>
              <p className="text-xs text-(--negative) font-medium">
                The owner can refuse vehicle handover without these physical original documents.
              </p>
            </div>

            {/* 5. Cancellation policy */}
            <div className="rounded-md border border-(--line) bg-(--surface) p-6">
              <h2 className="font-display text-lg font-bold text-(--ink) mb-2">
                Cancellation policy
              </h2>
              <p className="text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                {vehicle.freeCancellationHours
                  ? `Free cancellation up to ${vehicle.freeCancellationHours} hours before the scheduled pickup time.`
                  : "Free cancellation up to 6 hours before the scheduled pickup time."}{" "}
                You can cancel directly from your My Bookings dashboard. Cancellations made after this window may affect your traveler reliability rating.
              </p>
            </div>

            {/* 6. Pickup Location */}
            <div className="rounded-md border border-(--line) bg-(--surface) p-6">
              <h2 className="font-display text-lg font-bold text-(--ink) mb-2">
                Pickup location
              </h2>

              {isAgent ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-(--ink-soft) block">Rental shop address</span>
                    <span className="text-sm font-semibold text-(--ink) block">
                      {pickupAddress}
                    </span>
                    {vehicle.pickup?.landmark ? (
                      <span className="text-xs text-(--ink-soft) block mt-0.5">
                        Landmark: {vehicle.pickup.landmark}
                      </span>
                    ) : null}
                  </div>

                  {mapCoords ? (
                    <Map
                      latitude={mapCoords.lat}
                      longitude={mapCoords.lng}
                      label={pickupAddress}
                    />
                  ) : null}

                  <div>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--brand) hover:text-(--brand-dark) underline underline-offset-2"
                    >
                      <span>Get directions on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                  <p>
                    <strong>Approximate area:</strong>{" "}
                    {vehicle.pickup?.approximateArea || `${destinationName} area`}
                  </p>
                  <p className="rounded-md bg-(--paper) p-3 border border-(--line)">
                    This vehicle is listed by an individual owner. The exact pickup point is agreed with the owner after your booking is confirmed.
                  </p>
                </div>
              )}
            </div>

            {/* 7. About the Owner */}
            <div className="rounded-md border border-(--line) bg-(--surface) p-6">
              <h2 className="font-display text-lg font-bold text-(--ink) mb-3">
                About the publisher
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md bg-(--paper) border border-(--line)">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-(--ink)">
                      {publisherName}
                    </span>
                    <Badge tone="positive" className="text-[11px]">
                      Verified
                    </Badge>
                  </div>
                  <span className="text-xs text-(--ink-soft) block mt-1 capitalize">
                    {isAgent ? "Local Rental Shop" : "Individual Host"} in {destinationName}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-(--ink-soft)">
                  {vehicle.publisherProfile?.reliability?.score ? (
                    <div>
                      <span className="text-[11px] text-(--ink-soft) block">Reliability</span>
                      <span className="font-bold text-sm text-(--brand)">
                        {vehicle.publisherProfile.reliability.score}%
                      </span>
                    </div>
                  ) : null}

                  {vehicle.tripsCompleted ? (
                    <div>
                      <span className="text-[11px] text-(--ink-soft) block">Trips</span>
                      <span className="font-bold text-sm text-(--ink)">
                        {vehicle.tripsCompleted}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 8. Reviews Section */}
            <VehicleReviews
              vehicleId={vehicle._id}
              ratingAvg={vehicle.ratingAvg}
              ratingCount={vehicle.ratingCount}
            />
          </div>

          {/* Right Column (1/3): Booking Panel */}
          <div className="lg:col-span-1">
            <BookingPanel
              vehicle={vehicle}
              initialFrom={from}
              initialTo={to}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}

