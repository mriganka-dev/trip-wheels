"use client";

import React, { useState } from "react";
import type { Booking } from "@/types/booking";
import { markBookingPickedUp } from "@/lib/api/bookings";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PickupConfirmDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export function PickupConfirmDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: PickupConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await markBookingPickedUp(booking._id);
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm pickup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        title="Confirm Vehicle Pickup"
        description="Verify vehicle condition and keys collection."
        className="max-w-md"
      >
        <div className="space-y-3 py-2 text-sm text-ink">
          <p>
            Please confirm that you have met the owner, verified the vehicle condition and registration, and collected the keys.
          </p>
          <div className="rounded-md border border-line bg-paper-light p-3 text-xs text-ink-muted">
            Marking pickup will transition your booking status to <strong className="text-ink">On trip</strong>.
          </div>

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
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirm}
              isLoading={isSubmitting}
            >
              Confirm Pickup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
