import React from "react";
import type { Booking } from "@/types/booking";
import { formatCurrency, formatDateTime, formatDurationHours } from "@/lib/format";

interface BookingSummaryCardProps {
  booking: Booking;
}

export function BookingSummaryCard({ booking }: BookingSummaryCardProps) {
  const { startAt, endAt, durationHours, pricingSnapshot, vehicle, customerNote } = booking;
  const cancellationHours =
    vehicle?.cancellationPolicy?.freeCancellationHoursBeforePickup ||
    vehicle?.cancellationWindowHours ||
    vehicle?.freeCancellationHours ||
    24;

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Reservation Details
      </span>
      <h3 className="mt-0.5 font-serif text-lg font-bold text-ink">
        Booking Summary
      </h3>

      <div className="mt-4 space-y-4">
        {/* Schedule */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-paper-light p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Pickup Time
            </span>
            <p className="mt-1 font-medium text-sm text-ink">
              {formatDateTime(startAt)}
            </p>
          </div>

          <div className="rounded-md border border-line bg-paper-light p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Return Time
            </span>
            <p className="mt-1 font-medium text-sm text-ink">
              {formatDateTime(endAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted px-1">
          <span>Duration</span>
          <span className="font-semibold text-ink">
            {formatDurationHours(durationHours)}
          </span>
        </div>

        {/* Pricing breakdown */}
        <div className="rounded-md border border-line bg-paper-light p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-ink-muted">
            <span>Daily Rate</span>
            <span className="font-medium text-ink">
              {formatCurrency(pricingSnapshot.perDay)} / day
            </span>
          </div>

          {pricingSnapshot.deposit !== undefined && pricingSnapshot.deposit > 0 && (
            <div className="flex justify-between text-ink-muted">
              <span>Security Deposit (Refundable at return)</span>
              <span className="font-medium text-ink">
                {formatCurrency(pricingSnapshot.deposit)}
              </span>
            </div>
          )}

          <div className="border-t border-line pt-2 flex items-baseline justify-between">
            <div>
              <span className="font-serif font-bold text-sm text-ink">
                Estimated Total
              </span>
              <span className="block text-[11px] text-ink-muted">
                (Pay directly to owner at pickup)
              </span>
            </div>
            <span className="font-mono text-base font-bold text-brand">
              {formatCurrency(pricingSnapshot.estimatedTotal)}
            </span>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="rounded-md border border-line bg-paper-light p-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-ink-muted text-[10px]">
            Cancellation Policy
          </span>
          <p className="mt-1 text-ink">
            Free cancellation up to {cancellationHours} hours before pickup.
          </p>
        </div>

        {/* Customer Note */}
        {customerNote && (
          <div className="rounded-md border border-line bg-paper-light p-3 text-xs">
            <span className="font-semibold uppercase tracking-wider text-ink-muted text-[10px]">
              Your Note to Owner
            </span>
            <p className="mt-1 text-ink leading-relaxed italic">
              &quot;{customerNote}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
