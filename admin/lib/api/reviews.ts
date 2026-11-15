import { apiClient } from "./client";
import type {
  CreateReviewPayload,
  PaginatedReviewsResponse,
  Review,
} from "@/types/review";

export interface GetPublisherReviewsParams {
  page?: number;
  limit?: number;
}

export async function getPublisherReviews(
  publisherId: string,
  params?: GetPublisherReviewsParams
): Promise<PaginatedReviewsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return apiClient<PaginatedReviewsResponse>(
    `/publishers/${publisherId}/reviews${query ? `?${query}` : ""}`
  );
}

export async function createReview(
  bookingId: string,
  payload: CreateReviewPayload
): Promise<Review> {
  return apiClient<Review>(`/bookings/${bookingId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
