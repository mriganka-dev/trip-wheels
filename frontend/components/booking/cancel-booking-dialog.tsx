"use client";

import React, { useState } from "react";
import type { Booking } from "@/types/booking";
import { cancelBooking } from "@/lib/api/bookings";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";

interface CancelBookingDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export function CancelBookingDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const cancellationWindowHours =
    booking.vehicle?.cancellationPolicy?.freeCancellationHoursBeforePickup ||
    booking.vehicle?.cancellationWindowHours ||
    booking.vehicle?.freeCancellationHours ||
    24;
  const pickupTime = new Date(booking.startAt).getTime();
  const hoursRemaining = (pickupTime - now) / (1000 * 60 * 60);
  const isFree = hoursRemaining >= cancellationWindowHours;

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await cancelBooking(booking._id, reason.trim() || undefined);
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        title={`Cancel Booking ${booking.bookingCode}`}
        description="Please review the cancellation policy before proceeding."
        className="max-w-md"
      >
        <div className="space-y-4 py-2">
          {/* Policy Information */}
          <div
            className={`rounded-md border p-3.5 text-xs ${
              isFree
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="font-semibold">
              Free Cancellation Window: {cancellationWindowHours} hours
            </p>
            <p className="mt-1 leading-relaxed">
              {isFree
                ? `You are cancelling ${Math.floor(hoursRemaining)} hours before pickup, which is within the free cancellation window.`
                : `You are within ${cancellationWindowHours} hours of your scheduled pickup. Late cancellations may affect your account standing.`}
            </p>
          </div>

          <Field label="Reason for cancellation (optional)" htmlFor="cancel-reason">
            <Textarea
              id="cancel-reason"
              placeholder="Please let the owner know why you are cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
          </Field>

          {error && (
            <p className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
              {error}
            </p>
          )}

          <div className="flex gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="quiet"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Keep Booking
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleCancel}
              isLoading={isSubmitting}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
