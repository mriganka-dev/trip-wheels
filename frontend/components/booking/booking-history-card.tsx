import React from "react";
import type { BookingStatusHistoryItem } from "@/types/booking";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

interface BookingHistoryCardProps {
  history: BookingStatusHistoryItem[];
}

export function BookingHistoryCard({ history }: BookingHistoryCardProps) {
  if (!history || history.length === 0) {
    return null;
  }

  // Display chronologically (newest at bottom or top, readable list with times)
  const items = [...history].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Timeline
      </span>
      <h3 className="mt-0.5 font-serif text-lg font-bold text-ink">
        Status History
      </h3>

      <ol className="mt-4 space-y-3" role="list">
        {items.map((item, index) => {
          const config = BOOKING_STATUS_CONFIG[item.status];
          const label = config ? config.label : item.status;

          return (
            <li
              key={`${item.status}-${item.at}-${index}`}
              className="relative flex items-start gap-3 text-xs"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-brand shrink-0" />
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-semibold text-ink">{label}</span>
                  <span className="text-ink-muted text-[11px]">
                    {formatDateTime(item.at)}
                  </span>
                </div>
                {item.note && (
                  <p className="mt-0.5 text-ink-muted leading-relaxed">
                    {item.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

