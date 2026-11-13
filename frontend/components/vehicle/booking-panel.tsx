"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parseISO, differenceInHours } from "date-fns";
import { formatCurrency, formatDurationHours, isPickupLeadTimeValid } from "@/lib/format";
import { checkVehicleAvailability } from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { MIN_BOOKING_LEAD_HOURS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import type { Vehicle } from "@/types/vehicle";

export interface BookingPanelProps {
  vehicle: Vehicle;
  initialFrom?: string;
  initialTo?: string;
}

export function BookingPanel({
  vehicle,
  initialFrom = "",
  initialTo = "",
}: BookingPanelProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate dates
  const hasBothDates = Boolean(from && to);
  let isValidRange = false;
  let durationHours = 0;

  if (hasBothDates) {
    try {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      durationHours = differenceInHours(toDate, fromDate);
      isValidRange = toDate > fromDate && isPickupLeadTimeValid(from, MIN_BOOKING_LEAD_HOURS);
    } catch {
      isValidRange = false;
    }
  }

  // Live availability check
  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
  } = useQuery({
    queryKey: queryKeys.vehicles.availability(vehicle._id, from, to),
    queryFn: () => checkVehicleAvailability(vehicle._id, from, to),
    enabled: hasBothDates && isValidRange,
    staleTime: 15 * 1000,
  });

  // Calculate estimated cost
  let estimatedTotal = 0;
  if (isValidRange && durationHours > 0) {
    if (durationHours >= 24) {
      const days = Math.floor(durationHours / 24);
      const remHours = durationHours % 24;
      const hourlyRate = vehicle.pricing.perHour || Math.round(vehicle.pricing.perDay / 12);
      estimatedTotal = days * vehicle.pricing.perDay + remHours * hourlyRate;
    } else {
      const hourlyRate = vehicle.pricing.perHour || Math.round(vehicle.pricing.perDay / 12);
      estimatedTotal = durationHours * hourlyRate;
    }
  }

  const isAvailable = availabilityData ? availabilityData.isAvailable : true;
  const unavailableReason = availabilityData?.reason;

  const handleDateChange = (type: "from" | "to", val: string) => {
    setValidationError(null);
    if (type === "from") setFrom(val);
    if (type === "to") setTo(val);
  };

  const handleProceed = () => {
    setValidationError(null);

    if (!from || !to) {
      setValidationError("Please select both pickup and return dates.");
      return;
    }

    if (!isPickupLeadTimeValid(from, MIN_BOOKING_LEAD_HOURS)) {
      setValidationError(`Pickup must be at least ${MIN_BOOKING_LEAD_HOURS} hours from now.`);
      return;
    }

    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    if (toDate <= fromDate) {
      setValidationError("Return date and time must be after pickup.");
      return;
    }

    const minHours = vehicle.minRentalHours || 6;
    if (durationHours < minHours) {
      setValidationError(`Minimum rental duration for this vehicle is ${minHours} hours.`);
      return;
    }

    const targetUrl = `/book/${vehicle._id}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(targetUrl);
    }
  };

  const formContent = (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between pb-3 border-b border-(--line)">
        <div>
          <span className="font-display text-2xl font-bold text-(--brand)">
            {formatCurrency(vehicle.pricing.perDay)}
          </span>
          <span className="text-xs text-(--ink-soft)"> / day</span>
        </div>
        {vehicle.pricing.perHour && (
          <span className="text-xs text-(--ink-soft)">
            {formatCurrency(vehicle.pricing.perHour)} / hour
          </span>
        )}
      </div>

      {validationError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-(--negative)"
        >
          {validationError}
        </div>
      )}

      {!isAvailable && hasBothDates && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-(--warning)"
        >
          {unavailableReason || "This vehicle is not available for the selected dates. Please adjust your dates."}
        </div>
      )}

      <Field label="Pickup date & time" htmlFor="panel-from" required>
        <Input
          id="panel-from"
          type="datetime-local"
          value={from}
          onChange={(e) => handleDateChange("from", e.target.value)}
        />
      </Field>

      <Field label="Return date & time" htmlFor="panel-to" required>
        <Input
          id="panel-to"
          type="datetime-local"
          value={to}
          onChange={(e) => handleDateChange("to", e.target.value)}
        />
      </Field>

      {isValidRange && durationHours > 0 && (
        <div className="rounded-md bg-(--paper) p-3 border border-(--line) space-y-1.5 text-xs">
          <div className="flex justify-between text-(--ink-soft)">
            <span>Total duration:</span>
            <span className="font-medium text-(--ink)">
              {formatDurationHours(durationHours)}
            </span>
          </div>

          <div className="flex justify-between text-(--ink-soft)">
            <span>Estimated total:</span>
            <span className="font-display font-bold text-sm text-(--brand)">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>

          <p className="text-[11px] text-(--ink-soft) pt-1 border-t border-(--line)">
            Estimate only. You pay the owner directly at pickup.
          </p>
        </div>
      )}

      {vehicle.pricing.deposit ? (
        <div className="text-xs text-(--ink-soft)">
          Refundable security deposit: {formatCurrency(vehicle.pricing.deposit)} (collected at pickup).
        </div>
      ) : null}

      <div className="pt-2">
        <Button
          variant="primary"
          className="w-full"
          disabled={!isAvailable || isCheckingAvailability}
          onClick={handleProceed}
        >
          {isCheckingAvailability
            ? "Checking availability..."
            : !isAvailable
            ? "Unavailable for these dates"
            : "Request to book"}
        </Button>
      </div>

      <p className="text-[11px] text-center text-(--ink-soft)">
        You will not be charged now. The owner confirms your request.
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Panel */}
      <aside
        aria-label="Booking request panel"
        className="hidden lg:block rounded-md border border-(--line) bg-(--surface) p-6 sticky top-24 shadow-xs"
      >
        {formContent}
      </aside>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-(--surface) border-t border-(--line) px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <span className="font-display text-lg font-bold text-(--brand)">
            {formatCurrency(vehicle.pricing.perDay)}
          </span>
          <span className="text-xs text-(--ink-soft)"> / day</span>
          {isValidRange && estimatedTotal > 0 && (
            <div className="text-[11px] text-(--ink-soft)">
              Est: {formatCurrency(estimatedTotal)}
            </div>
          )}
        </div>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">
              Request to book
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Request this vehicle"
            description="Select pickup and return dates before sending request."
            className="max-h-[90vh] overflow-y-auto"
          >
            <div className="mt-4">{formContent}</div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

