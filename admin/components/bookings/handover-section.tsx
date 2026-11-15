"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMinutes, isAfter, parseISO } from "date-fns";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { declineHandover, markNoShow, recordHandover } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatTime } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface HandoverSectionProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function HandoverSection({
  booking,
  onSuccess,
}: HandoverSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [idChecked, setIdChecked] = useState(false);
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Decline dialog state
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState<
    "invalid_id" | "invalid_license" | "name_mismatch" | "other"
  >("invalid_id");
  const [declineNote, setDeclineNote] = useState("");
  const [declineError, setDeclineError] = useState<string | null>(null);

  // No-show dialog state
  const [isNoShowOpen, setIsNoShowOpen] = useState(false);
  const [noShowError, setNoShowError] = useState<string | null>(null);

  const customerName = booking.customer?.fullName || "Customer";
  const startAtDate = parseISO(booking.startAt);
  const graceEnd = addMinutes(startAtDate, 120);
  const now = new Date();
  const canMarkNoShow = isAfter(now, graceEnd);

  const handoverMutation = useMutation({
    mutationFn: () =>
      recordHandover(booking._id, {
        customerIdVerified: true,
        licenseVerified: true,
      }),
    onSuccess: () => {
      showToast("The booking status has been updated to on trip.", "brand");
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to record handover");
    },
  });

  const declineMutation = useMutation({
    mutationFn: () =>
      declineHandover(booking._id, {
        reason: declineReason,
        note: declineNote.trim() || undefined,
      }),
    onSuccess: () => {
      showToast("Handover declined and recorded for admin review.", "neutral");
      setIsDeclineOpen(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setDeclineError(err.message || "Failed to decline handover");
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => markNoShow(booking._id),
    onSuccess: () => {
      showToast("Customer no-show recorded successfully.", "warning");
      setIsNoShowOpen(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setNoShowError(err.message || "Failed to mark no-show");
    },
  });

  const canHandover = idChecked && licenseChecked && !handoverMutation.isPending;

  return (
    <section className="rounded-md border border-(--line) bg-(--surface) p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-(--line)">
        <div>
          <h2 className="text-base font-semibold text-(--ink)">
            Handover checklist
          </h2>
          <p className="text-sm text-(--ink-soft) mt-0.5">
            Complete mandatory verification before releasing the keys to the customer.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="rounded border border-(--line) bg-(--surface-soft) p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={idChecked}
              onChange={(e) => setIdChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-(--ink)">
              I checked the customer&apos;s government ID and the name matches the booking (<strong>{customerName}</strong>).
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={licenseChecked}
              onChange={(e) => setLicenseChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-(--ink)">
              I checked a valid driving license for this type of vehicle (<strong>{booking.vehicle.type}</strong>).
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <Button
            onClick={() => {
              setErrorMessage(null);
              handoverMutation.mutate();
            }}
            disabled={!canHandover}
            className="bg-(--brand) hover:bg-(--brand-hover) text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {handoverMutation.isPending ? "Recording handover..." : "Hand over the vehicle"}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDeclineError(null);
                setIsDeclineOpen(true);
              }}
              className="text-(--ink-soft) hover:text-(--ink)"
            >
              Decline handover
            </Button>

            {canMarkNoShow ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNoShowError(null);
                  setIsNoShowOpen(true);
                }}
                className="text-(--ink-soft) hover:text-(--ink)"
              >
                Customer did not arrive
              </Button>
            ) : (
              <span className="text-xs text-(--ink-soft)">
                No-show available at {formatTime(graceEnd)} (120 min grace period)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Decline Handover Dialog */}
      <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
        <DialogContent
          title="Decline vehicle handover"
          description={`Booking ${booking.bookingCode}`}
        >
          <div className="space-y-4">
            <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
              This is recorded for the Admin team and is not counted against your reliability score.
            </div>

            {declineError && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{declineError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Reason for declining handover *
              </label>
              <Select
                value={declineReason}
                onChange={(e) =>
                  setDeclineReason(
                    e.target.value as
                      | "invalid_id"
                      | "invalid_license"
                      | "name_mismatch"
                      | "other"
                  )
                }
              >
                <option value="invalid_id">Invalid or missing government ID</option>
                <option value="invalid_license">Invalid or missing driving license</option>
                <option value="name_mismatch">Name does not match booking</option>
                <option value="other">Other reason</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Note (optional)
              </label>
              <Textarea
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Details for the verification audit log"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeclineOpen(false)}
              disabled={declineMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => declineMutation.mutate()}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? "Declining..." : "Decline handover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Show Confirmation Dialog */}
      <Dialog open={isNoShowOpen} onOpenChange={setIsNoShowOpen}>
        <DialogContent
          title="Mark customer as no-show"
          description={`Booking ${booking.bookingCode}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-(--ink)">
              Are you sure you want to mark this customer as a no-show? The 120-minute grace period has passed without the customer arriving for pickup.
            </p>

            <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
              This will close the booking as a customer no-show and record the event for the platform reliability index.
            </div>

            {noShowError && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{noShowError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNoShowOpen(false)}
              disabled={noShowMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => noShowMutation.mutate()}
              disabled={noShowMutation.isPending}
            >
              {noShowMutation.isPending ? "Marking..." : "Confirm no-show"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
