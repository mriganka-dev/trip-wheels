import { apiClient } from "./client";
import type {
  AcceptBookingPayload,
  Booking,
  PaginatedBookingsResponse,
  RejectBookingPayload,
} from "@/types/booking";

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

export async function acceptBooking(
  id: string,
  payload?: AcceptBookingPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/accept`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

export async function rejectBooking(
  id: string,
  payload?: RejectBookingPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}
