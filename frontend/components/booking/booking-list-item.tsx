import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDateTime, formatTime, formatDate } from "@/lib/format";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types/booking";

export interface BookingListItemProps {
  booking: Booking;
}

function getNextActionText(booking: Booking): string {
  switch (booking.status) {
    case "requested":
      if (booking.responseDeadlineAt) {
        return `Owner has until ${formatTime(booking.responseDeadlineAt)} to respond`;
      }
      return "Waiting for owner response";
    case "confirmed":
      if (booking.vehicleConfirmation?.confirmedAt) {
        return `Vehicle confirmed. Pickup on ${formatDate(booking.startAt)}`;
      }
      return "Vehicle details will appear before pickup";
    case "ongoing":
      return `Trip ongoing. Return scheduled for ${formatDateTime(booking.endAt)}`;
    case "completed":
      return "Trip completed. Leave a review";
    case "rejected":
      return "Request was not accepted. Browse alternatives";
    case "expired":
      return "Request expired with no response. Browse other options";
    case "cancelled_by_customer":
      return "Cancelled by you";
    case "cancelled_by_publisher":
      return "Cancelled by the owner";
    case "vehicle_unavailable":
      return "Vehicle reported unavailable by owner";
    case "handover_declined":
      return "Handover declined at pickup";
    case "no_show":
      return "Marked as no show";
    default:
      return "View booking details";
  }
}

export function BookingListItem({ booking }: BookingListItemProps) {
  const statusMeta = BOOKING_STATUS_CONFIG[booking.status] || {
    label: booking.status,
    tone: "neutral" as const,
  };

  const primaryImage =
    booking.vehicle?.images?.find((img) => img.isPrimary) ||
    booking.vehicle?.images?.[0];

  const vehicleName = booking.vehicle
    ? `${booking.vehicle.brand} ${booking.vehicle.model}`
    : "Vehicle";

  const nextStepLine = getNextActionText(booking);

  return (
    <article className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 transition-colors hover:border-(--brand) focus-within:ring-2 focus-within:ring-(--brand)">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Photo on left */}
        <div className="w-full sm:w-28 sm:h-20 h-36 rounded-md bg-(--paper) border border-(--line) overflow-hidden relative shrink-0 flex items-center justify-center">
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={vehicleName}
              fill
              sizes="(max-width: 640px) 100vw, 112px"
              className="object-cover"
            />
          ) : (
            <span className="font-display text-xs text-(--ink-soft) p-2 text-center">
              {vehicleName}
            </span>
          )}
        </div>

        {/* Details in middle */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-(--ink-soft)">
              {booking.bookingCode}
            </span>
            <Badge tone={statusMeta.tone} className="text-xs">
              {statusMeta.label}
            </Badge>
          </div>

          <h3 className="font-display text-base font-bold text-(--ink)">
            <Link
              href={`/bookings/${booking._id}`}
              className="hover:text-(--brand) focus:outline-hidden"
            >
              {vehicleName}
            </Link>
          </h3>

          <div className="mt-1 text-xs text-(--ink-soft) flex flex-wrap gap-x-3 gap-y-1">
            <span>
              {formatDateTime(booking.startAt)} to {formatDateTime(booking.endAt)}
            </span>
          </div>

          <div className="mt-2 text-xs font-medium text-(--ink)">
            {nextStepLine}
          </div>
        </div>

        {/* View button */}
        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0 self-end sm:self-center">
          <Link
            href={`/bookings/${booking._id}`}
            className="inline-flex items-center justify-center w-full sm:w-auto font-medium rounded-md px-3.5 py-1.5 text-xs border border-(--line) bg-(--surface) text-(--ink) hover:border-(--brand) hover:text-(--brand) transition-colors"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
