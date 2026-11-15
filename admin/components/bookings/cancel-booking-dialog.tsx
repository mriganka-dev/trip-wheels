"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cancelBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import type { Booking } from "@/types/booking";

interface CancelBookingDialogProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  booking,
  onSuccess,
}: CancelBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (!reason.trim() || reason.trim().length < 5) {
        throw new Error("Please provide a reason of at least 5 characters");
      }
      return cancelBooking(booking._id, {
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      showToast("The booking has been cancelled and customer notified.", "warning");
      setIsOpen(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to cancel booking");
    },
  });

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setErrorMessage(null);
          setIsOpen(true);
        }}
        className="text-(--ink-soft) hover:text-(--ink)"
      >
        Cancel booking
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          title="Cancel booking"
          description={`Booking ${booking.bookingCode}`}
        >
          <div className="space-y-4">
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Reliability score impact</span>
              </div>
              <p>
                Cancelling a confirmed booking lowers your reliability score, and the customer is shown other vehicles.
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Reason for cancellation *
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this booking must be cancelled"
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Cancelling..." : "Confirm cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
