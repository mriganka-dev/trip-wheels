import { apiClient } from "./client";
import type { CreateReviewPayload, Review } from "@/types/review";

export async function createBookingReview(
  bookingId: string,
  payload: CreateReviewPayload
): Promise<Review> {
  return apiClient<Review>(`/bookings/${bookingId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

