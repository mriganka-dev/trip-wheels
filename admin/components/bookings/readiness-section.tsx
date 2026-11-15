"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { confirmPickupReady } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface ReadinessSectionProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function ReadinessSection({
  booking,
  onSuccess,
}: ReadinessSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfirmed = Boolean(booking.prePickupConfirmedAt);

  const mutation = useMutation({
    mutationFn: () => confirmPickupReady(booking._id),
    onSuccess: () => {
      showToast("Customer can see that you are prepared for this pickup.", "brand");
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to confirm pickup readiness");
    },
  });

  return (
    <section className="rounded-md border border-(--line) bg-(--surface) p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-(--ink)">
            Pickup readiness
          </h2>
          <p className="text-sm text-(--ink-soft) mt-0.5">
            Confirm to the customer that the vehicle is inspected, cleaned, and ready for handover.
          </p>
        </div>

        <div>
          {isConfirmed ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-(--brand) bg-(--brand)/10 px-3 py-1.5 rounded">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Ready since {formatDateTime(booking.prePickupConfirmedAt!)}
              </span>
            </div>
          ) : (
            <Button
              onClick={() => {
                setErrorMessage(null);
                mutation.mutate();
              }}
              disabled={mutation.isPending}
              className="bg-(--brand) hover:bg-(--brand-hover) text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Confirming..." : "Yes, I am ready for this pickup"}
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-rose-600 mt-2">{errorMessage}</p>
      )}
    </section>
  );
}
