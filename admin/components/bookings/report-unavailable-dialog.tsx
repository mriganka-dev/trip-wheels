"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInHours, parseISO } from "date-fns";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { reportVehicleUnavailable } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import type { Booking } from "@/types/booking";

interface ReportUnavailableDialogProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function ReportUnavailableDialog({
  booking,
  onSuccess,
}: ReportUnavailableDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<
    "rented_elsewhere" | "damaged" | "in_service" | "other"
  >("rented_elsewhere");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const now = new Date();
  const startAt = parseISO(booking.startAt);
  const hoursRemaining = Math.max(0, differenceInHours(startAt, now));
  const isLate = hoursRemaining < 24;

  const mutation = useMutation({
    mutationFn: () =>
      reportVehicleUnavailable(booking._id, {
        reason,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      showToast("Vehicle reported unavailable and customer notified.", "warning");
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
      setErrorMessage(err.message || "Failed to report vehicle unavailable");
    },
  });

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="text-(--ink-soft) hover:text-(--ink)"
        onClick={() => {
          setErrorMessage(null);
          setIsOpen(true);
        }}
      >
        This vehicle is not available
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          title="Report vehicle unavailable"
          description={`Booking ${booking.bookingCode}`}
        >
          <div className="space-y-4">
            <div
              className={`rounded border p-3 text-xs space-y-1.5 ${
                isLate
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-(--line) bg-(--surface-soft) text-(--ink-soft)"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {hoursRemaining} hours remaining before pickup ({isLate ? "Late report" : "On-time report"})
                </span>
              </div>
              <p>
                You must tell the customer at least 24 hours before pickup. If you tell them later it counts against your reliability score. If you do not tell them and the customer finds out at pickup, it counts as a serious failure.
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
                Reason *
              </label>
              <Select
                value={reason}
                onChange={(e) =>
                  setReason(
                    e.target.value as
                      | "rented_elsewhere"
                      | "damaged"
                      | "in_service"
                      | "other"
                  )
                }
              >
                <option value="rented_elsewhere">Rented elsewhere</option>
                <option value="damaged">Damaged or accident</option>
                <option value="in_service">In service or maintenance</option>
                <option value="other">Other reason</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Note (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Brief explanation for the customer and admin team"
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
              variant="danger"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Submitting report..."
                : "Submit unavailability report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
