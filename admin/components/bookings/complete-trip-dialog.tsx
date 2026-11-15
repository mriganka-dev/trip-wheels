"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAfter, parseISO } from "date-fns";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { completeBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import type { Booking } from "@/types/booking";

interface CompleteTripDialogProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function CompleteTripDialog({
  booking,
  onSuccess,
}: CompleteTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const now = new Date();
  const endAtDate = parseISO(booking.endAt);
  const isPastReturn = isAfter(now, endAtDate) || booking.isOverdue;

  const mutation = useMutation({
    mutationFn: () =>
      completeBooking(booking._id, {
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      showToast("The vehicle has been returned and the trip is closed.", "brand");
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
      setErrorMessage(err.message || "Failed to complete trip");
    },
  });

  return (
    <>
      <Button
        onClick={() => {
          setErrorMessage(null);
          setIsOpen(true);
        }}
        className="bg-(--brand) hover:bg-(--brand-hover) text-white"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Complete trip
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          title="Complete trip"
          description={`Booking ${booking.bookingCode}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-(--ink)">
              Confirm that the vehicle has been returned, inspected, and all keys and documents are accounted for.
            </p>

            {isPastReturn && (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>The return time has passed.</span>
                </div>
                <p>
                  Trips complete automatically a few hours after the return time if nobody marks it.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Return notes (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Returned on time in clean condition, full fuel tank verified"
                rows={3}
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="bg-(--brand) hover:bg-(--brand-hover) text-white"
            >
              {mutation.isPending ? "Completing..." : "Confirm completion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
