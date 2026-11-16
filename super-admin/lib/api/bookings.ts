import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  BookingDetail,
  BookingListQuery,
  OverrideBookingStatusPayload,
} from "@/types/bookings";

export async function getAdminBookings(
  query: BookingListQuery = {}
): Promise<PaginatedResponse<BookingDetail>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.destinationId && query.destinationId !== "all") {
    searchParams.set("destinationId", query.destinationId);
  }
  if (query.publisherId) searchParams.set("publisherId", query.publisherId);
  if (query.from) searchParams.set("from", query.from);
  if (query.to) searchParams.set("to", query.to);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<BookingDetail>>(
    `/admin/bookings${qs ? `?${qs}` : ""}`
  );
}

export async function getBookingById(id: string): Promise<BookingDetail> {
  return apiClient<BookingDetail>(`/bookings/${id}`);
}

export async function overrideBookingStatus(
  id: string,
  payload: OverrideBookingStatusPayload
): Promise<BookingDetail> {
  return apiClient<BookingDetail>(`/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
