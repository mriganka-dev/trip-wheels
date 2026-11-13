import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@/types/vehicle";

export interface VehicleListItemProps {
  vehicle: Vehicle;
  from?: string;
  to?: string;
}

export function VehicleListItem({ vehicle, from, to }: VehicleListItemProps) {
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];

  const queryParams = new URLSearchParams();
  if (from) queryParams.set("from", from);
  if (to) queryParams.set("to", to);
  const queryStr = queryParams.toString();
  const detailHref = `/vehicles/${vehicle._id}${queryStr ? `?${queryStr}` : ""}`;

  const hasRating =
    typeof vehicle.ratingAvg === "number" && vehicle.ratingAvg > 0;

  return (
    <article className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 transition-colors hover:border-(--brand) focus-within:ring-2 focus-within:ring-(--brand)">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        {/* Photo on left, top on mobile */}
        <div className="w-full sm:w-48 sm:h-36 h-48 rounded-md overflow-hidden bg-(--paper) border border-(--line) shrink-0 relative flex items-center justify-center">
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover"
            />
          ) : (
            <div className="p-4 text-center">
              <span className="font-display font-semibold text-xs text-(--ink-soft)">
                {vehicle.brand} {vehicle.model}
              </span>
            </div>
          )}
        </div>

        {/* Middle details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge tone="neutral" className="uppercase text-[10px]">
                {vehicle.type}
              </Badge>
              <span className="text-xs text-(--ink-soft) capitalize">
                {vehicle.transmission}
              </span>
              <span className="text-xs text-(--ink-soft)">&bull;</span>
              <span className="text-xs text-(--ink-soft) capitalize">
                {vehicle.fuelType}
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-(--ink) leading-snug">
              <Link
                href={detailHref}
                className="hover:text-(--brand) focus:outline-hidden"
              >
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </Link>
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-(--ink-soft)">
              <div className="flex items-center gap-1 font-medium text-(--ink)">
                <ShieldCheck className="w-3.5 h-3.5 text-(--brand)" />
                <span>{vehicle.publisher?.fullName || "Verified Publisher"}</span>
              </div>

              {hasRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-(--warning) text-(--warning)" />
                  <span className="font-semibold text-(--ink)">
                    {vehicle.ratingAvg?.toFixed(1)}
                  </span>
                  {vehicle.ratingCount ? (
                    <span>({vehicle.ratingCount})</span>
                  ) : null}
                </div>
              )}

              {vehicle.pickup?.approximateArea && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-(--ink-soft)" />
                  <span>{vehicle.pickup.approximateArea}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-(--line) sm:border-0 sm:pt-0 sm:mt-2 text-xs text-(--ink-soft)">
            Pay the owner at pickup. Valid ID and driving license required.
          </div>
        </div>

        {/* Right side: pricing */}
        <div className="w-full sm:w-auto sm:text-right shrink-0 flex sm:flex-col justify-between items-end gap-2 border-t sm:border-0 border-(--line) pt-3 sm:pt-0">
          <div>
            <div className="text-xs text-(--ink-soft)">Rate per day</div>
            <div className="font-display text-xl font-bold text-(--brand)">
              {formatCurrency(vehicle.pricing.perDay)}
              <span className="text-xs font-normal text-(--ink-soft)"> / day</span>
            </div>
            {vehicle.pricing.perHour && (
              <div className="text-xs text-(--ink-soft) mt-0.5">
                {formatCurrency(vehicle.pricing.perHour)} / hr
              </div>
            )}
            {vehicle.estimatedTotal && (
              <div className="mt-2 text-xs text-(--ink) font-medium">
                Est. total: {formatCurrency(vehicle.estimatedTotal)}
              </div>
            )}
          </div>

          <Link
            href={detailHref}
            className="inline-flex items-center justify-center font-medium rounded-md px-4 py-2 text-xs bg-(--brand) text-white hover:bg-(--brand-dark) transition-colors"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

