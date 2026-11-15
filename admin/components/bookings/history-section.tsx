"use client";

import React from "react";
import { formatDateTime } from "@/lib/format";
import type { BookingStatusHistoryItem } from "@/types/booking";

interface HistorySectionProps {
  statusHistory?: BookingStatusHistoryItem[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  requested: "Booking requested by customer",
  confirmed: "Booking confirmed by owner",
  ongoing: "Trip started - vehicle handed over",
  completed: "Trip completed",
  rejected: "Request declined by owner",
  expired: "Request expired without a response",
  cancelled_by_customer: "Cancelled by customer",
  cancelled_by_publisher: "Cancelled by owner",
  vehicle_unavailable: "Vehicle reported unavailable",
  handover_declined: "Handover declined at pickup",
  no_show: "Customer marked as no-show",
};

export function HistorySection({
  statusHistory,
  createdAt,
}: HistorySectionProps) {
  const history = statusHistory && statusHistory.length > 0
    ? statusHistory
    : [{ status: "requested", at: createdAt, note: "Initial request created" }];

  return (
    <section className="rounded-md border border-(--line) bg-(--surface) p-6">
      <div className="pb-4 border-b border-(--line)">
        <h2 className="text-base font-semibold text-(--ink)">
          Activity history
        </h2>
        <p className="text-sm text-(--ink-soft) mt-0.5">
          Timeline of status transitions and recorded events for this booking.
        </p>
      </div>

      <div className="mt-4 flow-root">
        <ul className="-mb-8">
          {history.map((item, idx) => {
            const isLast = idx === history.length - 1;
            const label = STATUS_LABELS[item.status] || item.status.replace(/_/g, " ");

            return (
              <li key={`${item.status}-${item.at}-${idx}`}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-2 -ml-px h-full w-0.5 bg-(--line)"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <span className="h-4 w-4 rounded-full bg-(--brand)/20 border border-(--brand) flex items-center justify-center ring-4 ring-white mt-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <span className="text-sm font-medium text-(--ink) capitalize">
                          {label}
                        </span>
                        <time className="text-xs text-(--ink-soft)">
                          {formatDateTime(item.at)}
                        </time>
                      </div>
                      {item.note && (
                        <p className="text-xs text-(--ink-soft) mt-1">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
