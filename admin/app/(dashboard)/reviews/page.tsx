"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, differenceInDays, isAfter, parseISO } from "date-fns";
import { Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewCustomerDialog } from "@/components/reviews/review-customer-dialog";
import { useAuth } from "@/hooks/use-auth";
import { getPublisherReviews } from "@/lib/api/reviews";
import { getReceivedBookings } from "@/lib/api/bookings";
import { formatDate, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { Booking } from "@/types/booking";

export default function ReviewsPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"received" | "review_customer">("received");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

  const publisherId = (user?._id || "") as string;

  // Received reviews query
  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: queryKeys.reviews.publisher(publisherId, { page, limit }),
    queryFn: () => getPublisherReviews(publisherId, { page, limit }),
    enabled: Boolean(publisherId) && tab === "received",
  });

  // Completed bookings for reviewing customers
  const {
    data: completedBookingsData,
    isLoading: isBookingsLoading,
    isError: isBookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: queryKeys.bookings.received({ status: "completed", limit: 30 }),
    queryFn: () => getReceivedBookings({ status: "completed", limit: 30 }),
    enabled: tab === "review_customer",
  });

  const reviews = reviewsData?.items || [];
  const totalReviewPages = reviewsData?.totalPages || 1;
  const completedBookings = completedBookingsData?.items || [];

  const now = new Date();

  return (
    <AppShell
      title="Ratings & Reviews"
      subtitle="View customer feedback and review travelers who rented your vehicles"
    >
      <div className="space-y-6">
        <Tabs
          value={tab}
          onValueChange={(newTab) => {
            setTab(newTab as "received" | "review_customer");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="received">Reviews received</TabsTrigger>
            <TabsTrigger value="review_customer">Review a customer</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "received" ? (
          <div className="space-y-6">
            {/* Aggregate summary */}
            {profile && profile.ratingCount != null && profile.ratingCount > 0 && (
              <div className="rounded-md border border-(--line) bg-(--surface) p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-(--ink-soft)">
                    Overall partner rating
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-bold font-display text-(--ink)">
                      {profile.ratingAvg?.toFixed(1) || "0.0"}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= Math.round(profile.ratingAvg || 0)
                              ? "fill-amber-500 text-amber-500"
                              : "text-zinc-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-(--ink-soft) mt-1">
                    Based on {profile.ratingCount} review{profile.ratingCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            )}

            {isReviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-md" />
                ))}
              </div>
            ) : isReviewsError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
                <p className="text-sm text-rose-800">
                  Could not load reviews. Please try again.
                </p>
                <Button size="sm" onClick={() => refetchReviews()}>
                  Retry
                </Button>
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="When customers complete trips and review your vehicles, their feedback and ratings will appear here."
              />
            ) : (
              <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-zinc-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-(--ink)">
                          {rev.rating} / 5
                        </span>
                      </div>
                      <time className="text-xs text-(--ink-soft)">
                        {formatDate(rev.createdAt)}
                      </time>
                    </div>

                    {rev.comment && (
                      <p className="text-sm text-(--ink) leading-relaxed">
                        &quot;{rev.comment}&quot;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-(--ink-soft) pt-1">
                      <span>By: {rev.reviewer?.fullName || "Traveler"}</span>
                      {rev.vehicle && (
                        <span>
                          Vehicle: {rev.vehicle.brand} {rev.vehicle.model}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalReviewPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalReviewPages}
                onPageChange={setPage}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft)">
              You can review a customer within 14 days of trip completion. Customer ratings help platform owners make informed decisions when accepting requests.
            </div>

            {isBookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : isBookingsError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
                <p className="text-sm text-rose-800">
                  Could not load completed bookings.
                </p>
                <Button size="sm" onClick={() => refetchBookings()}>
                  Retry
                </Button>
              </div>
            ) : completedBookings.length === 0 ? (
              <EmptyState
                title="No completed bookings to review"
                description="Once trips are marked completed, you can review the customer here within 14 days."
              />
            ) : (
              <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
                {completedBookings.map((b) => {
                  const completedDate = b.completion?.completedAt || b.endAt;
                  const windowClosingDate = addDays(parseISO(completedDate), 14);
                  const isWindowExpired = isAfter(now, windowClosingDate);
                  const daysRemaining = Math.max(
                    0,
                    differenceInDays(windowClosingDate, now)
                  );

                  return (
                    <div
                      key={b._id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-(--ink)">
                            {b.customer?.fullName || "Customer"}
                          </span>
                          <span className="text-xs font-mono text-(--ink-soft)">
                            {b.bookingCode}
                          </span>
                        </div>
                        <p className="text-xs text-(--ink-soft)">
                          Vehicle: {b.vehicle.brand} {b.vehicle.model}
                        </p>
                        <p className="text-[11px] text-(--ink-soft)">
                          Trip completed on {formatDateTime(completedDate)}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                        {isWindowExpired ? (
                          <span className="text-xs text-(--ink-soft)">
                            Review window closed
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-amber-800">
                              Review window closes in {daysRemaining} day{daysRemaining === 1 ? "" : "s"} ({formatDate(windowClosingDate)})
                            </span>
                            <Button
                              size="sm"
                              onClick={() => setSelectedBookingForReview(b)}
                              className="bg-(--brand) hover:bg-(--brand-hover) text-white"
                            >
                              Review customer
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedBookingForReview && (
        <ReviewCustomerDialog
          booking={selectedBookingForReview}
          isOpen={Boolean(selectedBookingForReview)}
          onClose={() => setSelectedBookingForReview(null)}
          onSuccess={() => refetchBookings()}
        />
      )}
    </AppShell>
  );
}
