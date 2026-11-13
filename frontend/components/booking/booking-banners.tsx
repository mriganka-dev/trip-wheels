import React from "react";
import Link from "next/link";
import type { Booking } from "@/types/booking";

interface BookingBannersProps {
  booking: Booking;
}

export function BookingBanners({ booking }: BookingBannersProps) {
  const { status, vehicleConfirmation, isOverdue, hasOpenIssue } = booking;

  const isVehicleMissed =
    Boolean(vehicleConfirmation?.missedAt) &&
    !Boolean(vehicleConfirmation?.confirmedAt);

  return (
    <div className="space-y-3">
      {/* Missed vehicle confirmation banner */}
      {isVehicleMissed && status === "confirmed" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 text-amber-700 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-semibold text-sm">
                Vehicle Confirmation Delayed
              </p>
              <p className="mt-0.5 leading-relaxed">
                The owner has not confirmed the exact vehicle yet. You can wait, look at other options, or cancel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle unavailable banner */}
      {status === "vehicle_unavailable" && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 text-rose-700 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-sm">Vehicle Unavailable</p>
              <p className="mt-0.5 leading-relaxed">
                The owner reported that this vehicle cannot be provided.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overdue banner */}
      {isOverdue && status === "ongoing" && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 text-rose-700 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
            <div>
              <p className="font-semibold text-sm">Return Overdue</p>
              <p className="mt-0.5 leading-relaxed">
                The return time has passed. Please return the vehicle and mark the trip as completed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open issue banner */}
      {hasOpenIssue && (
        <div className="rounded-lg border border-line bg-paper-light p-4 text-xs text-ink">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>You have an open issue on this booking.</span>
            </div>
            <Link
              href={`/bookings/${booking._id}/issue`}
              className="font-semibold text-brand hover:underline"
            >
              View Issue
            </Link>
          </div>
        </div>
      )}

      {/* Handover declined banner */}
      {status === "handover_declined" && (
        <div className="rounded-lg border border-line bg-paper-card p-4 text-xs text-ink">
          <p className="font-semibold text-sm">Handover Declined</p>
          <p className="mt-0.5 text-ink-muted leading-relaxed">
            Handover was declined by the owner because valid ID or driving license could not be verified.
          </p>
        </div>
      )}

      {/* No show banner */}
      {status === "no_show" && (
        <div className="rounded-lg border border-line bg-paper-card p-4 text-xs text-ink">
          <p className="font-semibold text-sm">Marked as No Show</p>
          <p className="mt-0.5 text-ink-muted leading-relaxed">
            This booking was marked as a no-show because the pickup time passed without collection.
          </p>
        </div>
      )}
    </div>
  );
}

