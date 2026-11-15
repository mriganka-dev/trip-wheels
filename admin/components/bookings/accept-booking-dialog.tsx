"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInHours, parseISO, subHours } from "date-fns";
import { AlertCircle, Calendar, CheckCircle2, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { acceptBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface AcceptBookingDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onSuccess?: () => void;
}

function AcceptBookingForm({
  booking,
  onClose,
  userRole,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  userRole?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [chassisNumber, setChassisNumber] = useState(
    () =>
      booking.vehicle?.chassisNumber ||
      booking.assignedVehicle?.chassisNumber ||
      ""
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    () =>
      booking.vehicle?.registrationNumber ||
      booking.assignedVehicle?.registrationNumber ||
      ""
  );
  const [color, setColor] = useState(
    () => booking.vehicle?.color || booking.assignedVehicle?.color || ""
  );
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startAtDate = parseISO(booking.startAt);
  const now = new Date();
  const hoursUntilPickup = differenceInHours(startAtDate, now);
  const isUnder24Hours = hoursUntilPickup < 24;

  const isExpired = booking.responseDeadlineAt
    ? now > parseISO(booking.responseDeadlineAt)
    : false;

  const vehicleConfirmationDeadline = subHours(startAtDate, 24);
  const vehicleTitle = `${booking.vehicle.brand} ${booking.vehicle.model}`;

  const acceptMutation = useMutation({
    mutationFn: () => {
      const payload = isUnder24Hours
        ? {
            chassisNumber: chassisNumber.trim(),
            registrationNumber: registrationNumber.trim().toUpperCase(),
            color: color.trim(),
            notes: notes.trim(),
          }
        : undefined;

      return acceptBooking(booking._id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.received() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.mine() });
      showToast("Booking request accepted.", "brand");
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to accept booking.");
      showToast(err.message || "Failed to accept booking.", "negative");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setErrorMessage("The response deadline has already passed.");
      return;
    }

    if (isUnder24Hours) {
      if (!chassisNumber.trim()) {
        setErrorMessage("Chassis number is required for vehicle confirmation.");
        return;
      }
      if (!registrationNumber.trim()) {
        setErrorMessage(
          "Registration number is required for vehicle confirmation."
        );
        return;
      }
    }

    setErrorMessage(null);
    acceptMutation.mutate();
  };

  return (
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

        <p className="text-[11px] text-(--ink) pt-1 border-t border-(--line)">
          The customer will be able to see your phone number and pickup
          details after you accept.
        </p>
      </div>

      {/* Individual Owner Note */}
      {userRole === "individual" && (
        <div className="p-3 rounded border border-(--brand)/30 bg-(--brand-tint)/40 text-xs text-(--brand-dark) flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-(--brand)" />
          <span>
            After accepting, agree the exact pickup point with the customer
            and set it on the booking.
          </span>
        </div>
      )}

      {/* Expired Warning */}
      {isExpired && (
        <div
          role="alert"
          className="p-3 rounded border border-(--negative) bg-(--negative)/10 text-xs text-(--negative) flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The response deadline for this request has passed. This request
            is expired and can no longer be accepted.
          </span>
        </div>
      )}

      {/* Under 24 Hours Rule vs Normal Confirmation Timing */}
      {isUnder24Hours ? (
        <div className="flex flex-col gap-3 p-3.5 rounded border border-amber-300 bg-amber-50 text-(--ink)">
          <div className="flex items-start gap-2 text-amber-900">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <p className="font-semibold text-xs">
              Pickup is less than 24 hours away, so vehicle confirmation
              details are required now before accepting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="accept-chassis"
                className="block text-[11px] font-semibold text-(--ink) mb-1"
              >
                Chassis number *
              </label>
              <Input
                id="accept-chassis"
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                placeholder="Enter chassis number"
                required
              />
            </div>

            <div>
              <label
                htmlFor="accept-reg"
                className="block text-[11px] font-semibold text-(--ink) mb-1"
              >
                Registration number *
              </label>
              <Input
                id="accept-reg"
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                placeholder="e.g. GA01AB1234"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="accept-color"
                className="block text-[11px] font-semibold text-(--ink) mb-1"
              >
                Vehicle color (optional)
              </label>
              <Input
                id="accept-color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Red"
              />
            </div>

            <div>
              <label
                htmlFor="accept-notes"
                className="block text-[11px] font-semibold text-(--ink) mb-1"
              >
                Handover notes (optional)
              </label>
              <Input
                id="accept-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Helmet included"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded border border-(--line) bg-(--surface) text-xs text-(--ink-soft)">
          <p>
            You will need to confirm the exact vehicle by{" "}
            <strong className="text-(--ink)">
              {formatDateTime(vehicleConfirmationDeadline)}
            </strong>{" "}
            (24 hours before trip start).
          </p>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-(--negative)">{errorMessage}</p>
      )}

      <DialogFooter className="mt-2">
        <Button
          type="button"
          variant="quiet"
          size="md"
          onClick={onClose}
          disabled={acceptMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isExpired || acceptMutation.isPending}
        >
          {acceptMutation.isPending
            ? "Accepting..."
            : isExpired
            ? "Expired"
            : "Confirm and accept"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AcceptBookingDialog({
  booking,
  isOpen,
  onClose,
  userRole,
  onSuccess,
}: AcceptBookingDialogProps) {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title={`Accept request ${booking.bookingCode}`}
        description="Confirm this customer booking request."
        className="max-w-lg"
      >
        <AcceptBookingForm
          key={booking._id}
          booking={booking}
          onClose={onClose}
          userRole={userRole}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
