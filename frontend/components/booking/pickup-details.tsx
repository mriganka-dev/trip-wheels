"use client";

import React from "react";
import type { BookingPickupDetails } from "@/types/booking";
import { Map } from "@/components/maps/map";

interface PickupDetailsProps {
  pickup: BookingPickupDetails;
}

export function PickupDetails({ pickup }: PickupDetailsProps) {
  const isFixed = pickup.mode === "fixed";
  const coordinates = pickup.location?.coordinates;
  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number";

  const lng = hasCoordinates ? coordinates[0] : 0;
  const lat = hasCoordinates ? coordinates[1] : 0;

  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : null;

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Pickup Details
          </span>
          <h3 className="mt-0.5 font-serif text-lg font-bold text-ink">
            {isFixed ? "Station Pickup" : "Doorstep / Flexible Pickup"}
          </h3>
        </div>
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            <span>Get directions</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {isFixed ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Address
            </p>
            <p className="mt-0.5 text-sm text-ink">
              {pickup.address || "Address will be provided by the agent."}
            </p>
          </div>

          {pickup.landmark && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Landmark
              </p>
              <p className="mt-0.5 text-sm text-ink">{pickup.landmark}</p>
            </div>
          )}

          {hasCoordinates && (
            <div className="mt-3 overflow-hidden rounded-md border border-line">
              <Map
                latitude={lat}
                longitude={lng}
                label={pickup.address || "Pickup Location"}
                className="h-56 w-full"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {pickup.finalizedAt && hasCoordinates ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Agreed Pickup Point
                </p>
                <p className="mt-0.5 text-sm text-ink">{pickup.address}</p>
                {pickup.landmark && (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Near {pickup.landmark}
                  </p>
                )}
              </div>

              <div className="mt-3 overflow-hidden rounded-md border border-line">
                <Map
                  latitude={lat}
                  longitude={lng}
                  label={pickup.address || "Pickup Location"}
                  className="h-56 w-full"
                />
              </div>
            </>
          ) : (
            <div className="rounded-md border border-line bg-paper-light p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Approximate Area
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">
                {pickup.approximateArea || "Local destination area"}
              </p>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                The owner will agree the exact pickup point with you. Call them on the number above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

