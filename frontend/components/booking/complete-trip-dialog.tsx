"use client";

import React, { useState } from "react";
import type { Booking } from "@/types/booking";
import { completeBooking } from "@/lib/api/bookings";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";

interface CompleteTripDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export function CompleteTripDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CompleteTripDialogProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await completeBooking(booking._id, note.trim() || undefined);
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark trip as complete. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        title="Complete Trip"
        description="Confirm that the vehicle has been returned to the owner."
        className="max-w-md"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-ink leading-relaxed">
            Please confirm that you have returned the vehicle to the owner in good condition and handed back the keys.
          </p>

          <Field label="Trip completion note (optional)" htmlFor="complete-note">
            <Textarea
              id="complete-note"
              placeholder="Any notes about the return or handover..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleComplete}
              isLoading={isSubmitting}
            >
              Mark as Completed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
