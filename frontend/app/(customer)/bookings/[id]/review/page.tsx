"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getBookingById } from "@/lib/api/bookings";
import { createBookingReview } from "@/lib/api/reviews";
import { queryKeys } from "@/lib/query-keys";
import type { Review } from "@/types/review";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

const AVAILABLE_TAGS = [
  "Clean vehicle",
  "Smooth ride",
  "Accurate pickup",
  "Responsive owner",
  "Good condition",
  "Well maintained",
  "Great mileage",
];

const STAR_LABELS: Record<number, string> = {
  1: "1 star - Poor",
  2: "2 stars - Fair",
  3: "3 stars - Good",
  4: "4 stars - Very good",
  5: "5 stars - Excellent",
};

export default function BookingReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittedReview, setSubmittedReview] = useState<Review | null>(null);
  const [now] = useState(() => Date.now());

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => getBookingById(id),
  });

  const mutation = useMutation({
    mutationFn: (payload: { rating: number; comment?: string; tags?: string[] }) =>
      createBookingReview(id, payload),
    onSuccess: (data) => {
      setSubmittedReview(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
    },
  });

  if (isLoading) {
    return (
      <div className="py-10">
        <Container size="default">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-40 w-full max-w-xl" />
        </Container>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="py-12">
        <Container size="default">
          <ErrorState
            title="Booking not found"
            message={error instanceof Error ? error.message : "Unable to load booking details."}
            onRetry={() => router.push("/bookings")}
          />
        </Container>
      </div>
    );
  }

  const { status, vehicle, assignedVehicle, updatedAt, endAt } = booking;
  const activeVehicle = assignedVehicle || vehicle;

  // Window calculation: 14 days from endAt / updatedAt
  const completedTimestamp = new Date(endAt || updatedAt || "").getTime();
  const daysSinceCompletion = (now - completedTimestamp) / (1000 * 60 * 60 * 24);
  const isWindowExpired = daysSinceCompletion > 14;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    mutation.mutate({
      rating,
      comment: comment.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="py-8 sm:py-12">
      <Container size="default">
        <div className="mb-4">
          <Link
            href={`/bookings/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Booking {booking.bookingCode}
          </Link>
        </div>

        <div className="max-w-xl">
          <header className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Trip Feedback
            </span>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-ink">
              Leave a Review
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {activeVehicle.brand} {activeVehicle.model} ({activeVehicle.year})
            </p>
          </header>

          {/* If already submitted */}
          {submittedReview ? (
            <div className="rounded-lg border border-line bg-paper-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="font-serif font-bold text-base">
                  Thank you for your review!
                </h2>
              </div>

              <div className="rounded-md border border-line bg-paper-light p-4 space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className={`h-5 w-5 ${
                        s <= submittedReview.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-ink">
                    {submittedReview.rating} out of 5
                  </span>
                </div>

                {submittedReview.comment && (
                  <p className="text-sm text-ink leading-relaxed">
                    &quot;{submittedReview.comment}&quot;
                  </p>
                )}

                {submittedReview.tags && submittedReview.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {submittedReview.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-paper px-2 py-0.5 text-xs text-ink-muted border border-line"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link href={`/bookings/${id}`}>
                  <Button variant="primary" size="md">
                    Return to Booking Details
                  </Button>
                </Link>
              </div>
            </div>
          ) : status !== "completed" ? (
            /* Not completed check */
            <div className="rounded-lg border border-line bg-paper-card p-6">
              <h2 className="font-serif font-bold text-base text-ink">
                Review Not Yet Available
              </h2>
              <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                Reviews can only be submitted after your trip has been marked as completed.
              </p>
              <div className="mt-4">
                <Link href={`/bookings/${id}`}>
                  <Button variant="secondary" size="sm">
                    Back to Booking
                  </Button>
                </Link>
              </div>
            </div>
          ) : isWindowExpired ? (
            /* Window expired check */
            <div className="rounded-lg border border-line bg-paper-card p-6">
              <h2 className="font-serif font-bold text-base text-ink">
                Review Window Expired
              </h2>
              <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                The 14-day review window for this trip has closed. Reviews cannot be submitted after 14 days of trip completion.
              </p>
              <div className="mt-4">
                <Link href={`/bookings/${id}`}>
                  <Button variant="secondary" size="sm">
                    Back to Booking
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Review Form */
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-line bg-paper-card p-6 space-y-6"
            >
              {/* Star Rating as accessible radio group */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  Overall Experience (Rating)
                </label>
                <fieldset className="flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label
                      key={star}
                      className="cursor-pointer p-1 rounded hover:bg-paper-light focus-within:ring-2 focus-within:ring-brand"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={star}
                        checked={rating === star}
                        onChange={() => setRating(star)}
                        className="sr-only"
                        aria-label={STAR_LABELS[star]}
                      />
                      <svg
                        className={`h-7 w-7 transition-colors ${
                          star <= activeRating
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-300"
                        }`}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </label>
                  ))}
                  <span className="ml-2 font-serif text-sm font-semibold text-ink">
                    {STAR_LABELS[activeRating]}
                  </span>
                </fieldset>
              </div>

              {/* Tag selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  Highlights (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-brand text-white border-brand"
                            : "bg-paper-light border-line text-ink hover:border-ink-muted"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment */}
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label
                    htmlFor="review-comment"
                    className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
                  >
                    Your Feedback (optional)
                  </label>
                  <span className="text-[11px] text-ink-muted">
                    {comment.length} / 1000 characters
                  </span>
                </div>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Share details about the vehicle cleanliness, handover experience, and driving performance..."
                />
              </div>

              {mutation.isError && (
                <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Failed to submit review. Please try again."}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => router.push(`/bookings/${id}`)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={mutation.isPending}
                >
                  Submit Review
                </Button>
              </div>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}
