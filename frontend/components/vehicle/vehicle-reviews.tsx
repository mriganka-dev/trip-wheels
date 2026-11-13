"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getVehicleReviews } from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleReviewsData } from "@/types/review";

export interface VehicleReviewsProps {
  vehicleId: string;
  ratingAvg?: number;
  ratingCount?: number;
}

export function VehicleReviews({
  vehicleId,
  ratingAvg,
  ratingCount,
}: VehicleReviewsProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<VehicleReviewsData>({
    queryKey: queryKeys.vehicles.reviews(vehicleId, page),
    queryFn: () => getVehicleReviews(vehicleId, page, 5),
    staleTime: 60 * 1000,
  });

  const reviews = data?.items || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-(--line) gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-(--ink)">
            Customer reviews
          </h2>
          <p className="text-xs text-(--ink-soft) mt-0.5">
            Verified traveler feedback from completed bookings
          </p>
        </div>

        {typeof ratingAvg === "number" && ratingAvg > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Star className="w-4 h-4 fill-(--warning) text-(--warning)" />
            <span className="font-display font-bold text-base text-(--ink)">
              {ratingAvg.toFixed(1)}
            </span>
            <span className="text-xs text-(--ink-soft)">
              ({ratingCount || reviews.length} {ratingCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <div className="py-8 text-center text-xs text-(--ink-soft)">
          No traveler reviews yet for this vehicle.
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="divide-y divide-(--line)/70">
          {reviews.map((rev) => (
            <div key={rev._id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-xs text-(--ink)">
                  {rev.reviewer?.fullName || "Verified Traveler"}
                </span>
                <span className="text-[11px] text-(--ink-soft)">
                  {formatDate(rev.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < rev.rating
                        ? "fill-(--warning) text-(--warning)"
                        : "text-(--line)"
                    }`}
                  />
                ))}
              </div>

              {rev.comment && (
                <p className="text-xs text-(--ink-soft) leading-relaxed">
                  {rev.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-(--line)">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
}

