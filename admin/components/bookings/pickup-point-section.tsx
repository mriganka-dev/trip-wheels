"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Map } from "@/components/maps/map";
import { PinPicker } from "@/components/maps/pin-picker";
import { finalizePickupPoint } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface PickupPointSectionProps {
  booking: Booking;
  userRole?: string;
  onSuccess?: () => void;
}

export function PickupPointSection({
  booking,
  userRole,
  onSuccess,
}: PickupPointSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isIndividual =
    userRole === "individual" || booking.pickup?.mode === "flexible";

  const isFinalized = Boolean(booking.pickup?.finalizedAt);
  const [isEditing, setIsEditing] = useState(!isFinalized && isIndividual);

  const initialAddress =
    booking.pickup?.address || booking.vehicle?.pickup?.address || "";
  const initialLandmark =
    booking.pickup?.landmark || booking.vehicle?.pickup?.landmark || "";
  const initialNote = booking.pickup?.note || "";

  // [lng, lat]
  const initialCoords: [number, number] =
    booking.pickup?.location?.coordinates &&
    booking.pickup.location.coordinates.length === 2 &&
    (booking.pickup.location.coordinates[0] !== 0 || booking.pickup.location.coordinates[1] !== 0)
      ? booking.pickup.location.coordinates
      : booking.vehicle?.pickup?.location?.coordinates &&
        booking.vehicle.pickup.location.coordinates.length === 2 &&
        (booking.vehicle.pickup.location.coordinates[0] !== 0 || booking.vehicle.pickup.location.coordinates[1] !== 0)
      ? booking.vehicle.pickup.location.coordinates
      : [74.124, 15.2993]; // Default fallback Goa coordinates

  const [address, setAddress] = useState(initialAddress);
  const [landmark, setLandmark] = useState(initialLandmark);
  const [note, setNote] = useState(initialNote);
  const [coordinates, setCoordinates] = useState<[number, number]>(initialCoords);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (!address.trim() || address.trim().length < 3) {
        throw new Error("Address must be at least 3 characters");
      }
      return finalizePickupPoint(booking._id, {
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        coordinates,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      showToast("The exact pickup point is now visible to the customer.", "brand");
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to save pickup point");
    },
  });

  // Current display coordinates
  const displayCoords = booking.pickup?.location?.coordinates || initialCoords;
  const hasValidCoords =
    displayCoords &&
    displayCoords.length === 2 &&
    (displayCoords[0] !== 0 || displayCoords[1] !== 0);

  return (
    <section className="rounded-md border border-(--line) bg-(--surface) p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-(--line)">
        <div>
          <h2 className="text-base font-semibold text-(--ink)">
            Pickup location
          </h2>
          <p className="text-sm text-(--ink-soft) mt-0.5">
            {isIndividual
              ? "Agreed pickup point for this customer"
              : "Fixed shop pickup location"}
          </p>
        </div>
        {isFinalized && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--brand) bg-(--brand)/10 px-2.5 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Finalized on {formatDateTime(booking.pickup!.finalizedAt!)}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {isIndividual && isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
              Agree this with the customer by phone, then save it here so they can find you.
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Pickup address *
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Calangute Circle, Calangute"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Landmark (optional)
                </label>
                <Input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite State Bank ATM"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Note for customer (optional)
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. White gate next to the bakery"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Pinpoint on map *
              </label>
              <PinPicker
                value={coordinates}
                onChange={setCoordinates}
                defaultCenter={coordinates}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-(--brand) hover:bg-(--brand-hover) text-white"
              >
                {mutation.isPending ? "Saving..." : "Save pickup point"}
              </Button>
              {isFinalized && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Address
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.pickup?.address ||
                    booking.vehicle?.pickup?.address ||
                    "Address not set yet"}
                </dd>
              </div>

              {(booking.pickup?.landmark || booking.vehicle?.pickup?.landmark) && (
                <div>
                  <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                    Landmark
                  </dt>
                  <dd className="text-(--ink) mt-0.5">
                    {booking.pickup?.landmark || booking.vehicle?.pickup?.landmark}
                  </dd>
                </div>
              )}

              {booking.pickup?.note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                    Directions note
                  </dt>
                  <dd className="text-(--ink) mt-0.5">{booking.pickup.note}</dd>
                </div>
              )}
            </dl>

            {hasValidCoords && (
              <div className="pt-2">
                <Map
                  latitude={displayCoords[1]}
                  longitude={displayCoords[0]}
                  label={booking.pickup?.address || "Pickup location"}
                  className="h-56 w-full rounded-md border border-(--line)"
                />
              </div>
            )}

            {isIndividual && (
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  {isFinalized ? "Change pickup point" : "Set exact pickup point"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
