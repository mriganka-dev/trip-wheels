"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { decideModification } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime, formatDurationBetween } from "@/lib/format";
import type { Booking } from "@/types/booking";

interface ModificationRequestsSectionProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function ModificationRequestsSection({
  booking,
  onSuccess,
}: ModificationRequestsSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingRequests = (booking.modificationRequests || []).filter(
    (r) => r.status === "pending"
  );

  const mutation = useMutation({
    mutationFn: ({
      reqId,
      action,
    }: {
      reqId: string;
      action: "accept" | "reject";
    }) => decideModification(booking._id, reqId, action),
    onSuccess: (_, vars) => {
      showToast(
        vars.action === "accept"
          ? "The booking dates have been updated."
          : "The date change request has been rejected.",
        vars.action === "accept" ? "brand" : "neutral"
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking._id),
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "received"],
      });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to process date change decision");
    },
  });

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-amber-300 bg-amber-50/50 p-6">
      <div className="flex items-center gap-2 pb-4 border-b border-amber-200">
        <Calendar className="w-5 h-5 text-amber-800 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-amber-950">
            Customer requested date change
          </h2>
          <p className="text-xs text-amber-800 mt-0.5">
            The customer requested new trip dates for this booking.
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

        {pendingRequests.map((req) => (
          <div
            key={req._id}
            className="rounded border border-amber-200 bg-white p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Requested pickup
                </span>
                <p className="font-medium text-(--ink) mt-0.5">
                  {formatDateTime(req.newStartAt)}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Requested return
                </span>
                <p className="font-medium text-(--ink) mt-0.5">
                  {formatDateTime(req.newEndAt)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  New duration
                </span>
                <p className="font-medium text-(--ink) mt-0.5">
                  {formatDurationBetween(req.newStartAt, req.newEndAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-(--line)">
              <Button
                size="sm"
                onClick={() => {
                  setErrorMessage(null);
                  mutation.mutate({ reqId: req._id, action: "accept" });
                }}
                disabled={mutation.isPending}
                className="bg-(--brand) hover:bg-(--brand-hover) text-white"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Accept new dates
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setErrorMessage(null);
                  mutation.mutate({ reqId: req._id, action: "reject" });
                }}
                disabled={mutation.isPending}
              >
                <X className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
