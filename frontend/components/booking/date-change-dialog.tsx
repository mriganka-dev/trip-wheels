"use client";

import React, { useState } from "react";
import type { Booking } from "@/types/booking";
import { requestBookingModification } from "@/lib/api/bookings";
import { toDateTimeLocalString } from "@/lib/format";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

interface DateChangeDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export function DateChangeDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: DateChangeDialogProps) {
  const defaultStart = toDateTimeLocalString(new Date(booking.startAt));
  const defaultEnd = toDateTimeLocalString(new Date(booking.endAt));

  const [newStart, setNewStart] = useState(defaultStart);
  const [newEnd, setNewEnd] = useState(defaultEnd);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minPickup] = useState(() =>
    toDateTimeLocalString(new Date(Date.now() + 3 * 3600 * 1000))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startDate = new Date(newStart);
    const endDate = new Date(newEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError("Please select valid dates and times.");
      return;
    }

    if (startDate <= new Date()) {
      setError("New pickup time must be in the future.");
      return;
    }

    if (endDate <= startDate) {
      setError("New return time must be strictly after pickup time.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await requestBookingModification(booking._id, {
        newStartAt: startDate.toISOString(),
        newEndAt: endDate.toISOString(),
      });
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit date change request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        title="Request Date Change"
        description="Select new pickup and return times for your trip."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-xs text-ink-muted leading-relaxed">
            The owner must review and accept your requested dates. Your existing booking remains confirmed until the owner approves this change.
          </p>

          <Field label="New Pickup Time" htmlFor="new-pickup" required>
            <Input
              id="new-pickup"
              type="datetime-local"
              value={newStart}
              min={minPickup}
              onChange={(e) => setNewStart(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field label="New Return Time" htmlFor="new-return" required>
            <Input
              id="new-return"
              type="datetime-local"
              value={newEnd}
              min={newStart || minPickup}
              onChange={(e) => setNewEnd(e.target.value)}
              required
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
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
