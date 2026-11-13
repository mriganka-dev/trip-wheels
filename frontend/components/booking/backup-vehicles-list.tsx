"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getBackupVehicles } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BackupVehiclesListProps {
  bookingId: string;
  startAt: string;
  endAt: string;
}

export function BackupVehiclesList({
  bookingId,
  startAt,
  endAt,
}: BackupVehiclesListProps) {
  const {
    data: backups,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.bookings.backups(bookingId),
    queryFn: () => getBackupVehicles(bookingId),
    staleTime: 60000,
  });

  const vehicles = Array.isArray(backups) ? backups.slice(0, 3) : [];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-line bg-paper-card p-5">
        <h3 className="font-serif text-base font-bold text-ink">
          Similar Available Vehicles
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          Checking other available vehicles for your dates...
        </p>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (isError || vehicles.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-paper-card p-5">
        <h3 className="font-serif text-base font-bold text-ink">
          Other Options
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          No direct backup matches were found for these exact dates. You can search other available vehicles in this destination.
        </p>
        <div className="mt-3">
          <Link href="/search">
            <Button variant="secondary" size="sm">
              Search All Vehicles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-bold text-ink">
            Similar Available Vehicles
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            You can request any of these similar vehicles for the exact same trip dates.
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-line">
        {vehicles.map((v) => {
          const primaryPhoto = v.images?.[0]?.url || "/placeholder-vehicle.jpg";
          const bookUrl = `/book/${v._id}?startAt=${encodeURIComponent(
            startAt
          )}&endAt=${encodeURIComponent(endAt)}`;

          return (
            <div
              key={v._id}
              className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-paper-light border border-line">
                  <Image
                    src={primaryPhoto}
                    alt={`${v.brand} ${v.model}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-ink">
                    {v.brand} {v.model} ({v.year})
                  </h4>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                    <span className="capitalize">{v.type}</span>
                    <span>•</span>
                    <span className="capitalize">{v.fuelType}</span>
                    <span>•</span>
                    <span className="capitalize">{v.transmission}</span>
                    <span>•</span>
                    <span>{v.seats} seats</span>
                  </div>
                  <p className="mt-1 font-semibold text-xs text-ink">
                    {formatCurrency(v.pricing?.perDay || 0)}
                    <span className="font-normal text-ink-muted"> / day</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center">
                <Link href={bookUrl}>
                  <Button size="sm" variant="secondary">
                    Request for same dates
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
