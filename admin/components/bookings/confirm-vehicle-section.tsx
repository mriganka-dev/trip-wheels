"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { confirmVehicle } from "@/lib/api/bookings";
import { getMyVehicles } from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface ConfirmVehicleSectionProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function ConfirmVehicleSection({
  booking,
  onSuccess,
}: ConfirmVehicleSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isConfirmed = Boolean(booking.vehicleConfirmation?.confirmedAt);
  const [isEditing, setIsEditing] = useState(!isConfirmed);

  const initialChassis =
    booking.vehicleConfirmation?.chassisNumber ||
    booking.assignedVehicle?.chassisNumber ||
    booking.vehicle?.chassisNumber ||
    "";

  const initialReg =
    booking.vehicleConfirmation?.registrationNumber ||
    booking.assignedVehicle?.registrationNumber ||
    booking.vehicle?.registrationNumber ||
    "";

  const initialColor =
    booking.vehicleConfirmation?.color ||
    booking.assignedVehicle?.color ||
    booking.vehicle?.color ||
    "";

  const initialNotes = booking.vehicleConfirmation?.notes || "";
  const initialAssignedId =
    booking.assignedVehicle?._id || booking.vehicle?._id || "";

  const [chassisNumber, setChassisNumber] = useState(initialChassis);
  const [registrationNumber, setRegistrationNumber] = useState(initialReg);
  const [color, setColor] = useState(initialColor);
  const [notes, setNotes] = useState(initialNotes);
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialAssignedId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch publisher's other vehicles of same type for optional swap
  const { data: vehiclesData } = useQuery({
    queryKey: queryKeys.vehicles.mine({ limit: 50 }),
    queryFn: () => getMyVehicles({ limit: 50 }),
    enabled: isEditing,
  });

  const availableVehicles = (vehiclesData?.items || []).filter(
    (v) =>
      v.status === "active" &&
      (!booking.vehicle.type || v.type === booking.vehicle.type)
  );

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (!chassisNumber.trim() || chassisNumber.trim().length < 3) {
        throw new Error("Chassis number must be at least 3 characters");
      }
      if (!registrationNumber.trim() || registrationNumber.trim().length < 3) {
        throw new Error("Registration number must be at least 3 characters");
      }

      const payload: {
        chassisNumber: string;
        registrationNumber: string;
        color?: string;
        notes?: string;
        assignedVehicleId?: string;
      } = {
        chassisNumber: chassisNumber.trim().toUpperCase(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        color: color.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (selectedVehicleId && selectedVehicleId !== booking.vehicle._id) {
        payload.assignedVehicleId = selectedVehicleId;
      }

      return confirmVehicle(booking._id, payload);
    },
    onSuccess: () => {
      showToast("The exact vehicle details have been saved for this booking.", "brand");
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to confirm vehicle");
    },
  });

  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId);
    const chosen = availableVehicles.find((v) => v._id === vId);
    if (chosen) {
      if (chosen.chassisNumber) setChassisNumber(chosen.chassisNumber);
      if (chosen.registrationNumber) setRegistrationNumber(chosen.registrationNumber);
      if (chosen.color) setColor(chosen.color);
    }
  };

  const dueTime = booking.vehicleConfirmation?.dueAt
    ? formatDateTime(booking.vehicleConfirmation.dueAt)
    : null;

  return (
    <section className="rounded-md border border-(--line) bg-(--surface) p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-(--line)">
        <div>
          <h2 className="text-base font-semibold text-(--ink)">
            Confirm the exact vehicle
          </h2>
          {dueTime && !isConfirmed && (
            <p className="text-sm text-(--ink-soft) mt-0.5">
              Confirm by {dueTime}
            </p>
          )}
        </div>
        {isConfirmed && !isEditing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--brand) bg-(--brand)/10 px-2.5 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed on {formatDateTime(booking.vehicleConfirmation!.confirmedAt!)}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {isConfirmed && !isEditing ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Assigned vehicle
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.assignedVehicle?.brand || booking.vehicle.brand}{" "}
                  {booking.assignedVehicle?.model || booking.vehicle.model}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Registration number
                </dt>
                <dd className="font-mono font-medium text-(--ink) mt-0.5">
                  {booking.vehicleConfirmation?.registrationNumber || "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Chassis number
                </dt>
                <dd className="font-mono font-medium text-(--ink) mt-0.5">
                  {booking.vehicleConfirmation?.chassisNumber || "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Color
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.vehicleConfirmation?.color || "Not recorded"}
                </dd>
              </div>
              {booking.vehicleConfirmation?.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                    Handover notes
                  </dt>
                  <dd className="text-(--ink) mt-0.5">
                    {booking.vehicleConfirmation.notes}
                  </dd>
                </div>
              )}
            </dl>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Update vehicle details
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft) space-y-1">
              <p>
                The customer sees these details only after you confirm, and checks them against the vehicle at pickup.
              </p>
              <p>
                If this is not confirmed in time, the customer is warned and shown other vehicles, and it lowers your reliability score.
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {availableVehicles.length > 1 && (
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Use a different vehicle (optional swap)
                </label>
                <Select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                >
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.brand} {v.model} ({v.type})
                      {v.registrationNumber ? ` - ${v.registrationNumber}` : ""}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-(--ink-soft) mt-1">
                  You can swap to another active vehicle of the same type if available.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Registration number *
                </label>
                <Input
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. GA 01 AB 1234"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Chassis number *
                </label>
                <Input
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ME4JF5045H012345"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Color (optional)
                </label>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Matte Black"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Notes for handover (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Helmet included, key fob instructions, fuel level"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-(--brand) hover:bg-(--brand-hover) text-white"
              >
                {mutation.isPending ? "Saving details..." : "Save and confirm vehicle"}
              </Button>
              {isConfirmed && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
