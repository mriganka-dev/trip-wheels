import { apiClient } from "./client";
import type { Booking, PaginatedBookingsResponse } from "@/types/booking";

export interface GetReceivedBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export async function getReceivedBookings(
  params?: GetReceivedBookingsParams
): Promise<PaginatedBookingsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();
  return apiClient<PaginatedBookingsResponse>(
    `/bookings/received${query ? `?${query}` : ""}`
  );
}

export async function getBooking(id: string): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}`);
}
