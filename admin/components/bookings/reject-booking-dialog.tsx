"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { AlertCircle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { rejectBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface RejectBookingDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RejectBookingDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: RejectBookingDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isExpired = booking?.responseDeadlineAt
    ? new Date() > parseISO(booking.responseDeadlineAt)
    : false;

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!booking) throw new Error("No booking selected.");
      return rejectBooking(booking._id, {
        reason: reason.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.received() });
      if (booking) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(booking._id),
        });
      }
      showToast("Booking request rejected.", "neutral");
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to reject booking.");
      showToast(err.message || "Failed to reject booking.", "negative");
    },
  });

  if (!booking) return null;

  const vehicleTitle = `${booking.vehicle.brand} ${booking.vehicle.model}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setErrorMessage("The response deadline has already passed.");
      return;
    }
    setErrorMessage(null);
    rejectMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title={`Reject request ${booking.bookingCode}`}
        description="Decline this customer booking request."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1 text-xs text-(--ink)">
          {/* Booking Summary Box */}
          <div className="p-3.5 rounded border border-(--line) bg-(--paper) flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-(--ink)">
                {vehicleTitle}
              </span>
              <span className="font-mono text-xs text-(--ink-soft)">
                {booking.bookingCode}
              </span>
            </div>

            <div className="text-xs text-(--ink-soft) flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-(--brand)" />
              <span>
                {formatDate(booking.startAt)} to {formatDate(booking.endAt)}
              </span>
            </div>
          </div>

          {/* Consequence notice */}
          <div className="p-3 rounded border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <p>
              The customer will be shown other vehicles. Rejecting too often
              lowers your reliability score.
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label
              htmlFor="reject-reason"
              className="block text-xs font-semibold text-(--ink) mb-1"
            >
              Reason for rejection (optional)
            </label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Vehicle in maintenance, unavailable during these dates"
              maxLength={500}
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-(--negative)">{errorMessage}</p>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="quiet"
              size="md"
              onClick={onClose}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              disabled={isExpired || rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? "Rejecting..."
                : isExpired
                ? "Expired"
                : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
