import { apiClient } from "./client";
import type {
  AcceptBookingPayload,
  Booking,
  CancelBookingPayload,
  ConfirmPickupReadyPayload,
  ConfirmVehiclePayload,
  DeclineHandoverPayload,
  FinalizePickupPointPayload,
  HandoverPayload,
  PaginatedBookingsResponse,
  RejectBookingPayload,
  ReportVehicleUnavailablePayload,
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

export async function cancelBooking(
  id: string,
  payload: CancelBookingPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function finalizePickupPoint(
  id: string,
  payload: FinalizePickupPointPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/pickup-point`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function confirmVehicle(
  id: string,
  payload: ConfirmVehiclePayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/confirm-vehicle`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function reportVehicleUnavailable(
  id: string,
  payload: ReportVehicleUnavailablePayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/report-vehicle-unavailable`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function confirmPickupReady(
  id: string,
  payload?: ConfirmPickupReadyPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/confirm-pickup-ready`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

export async function recordHandover(
  id: string,
  payload: HandoverPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/handover`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function declineHandover(
  id: string,
  payload: DeclineHandoverPayload
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/decline-handover`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function markNoShow(id: string): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/mark-no-show`, {
    method: "PATCH",
  });
}

export async function completeBooking(
  id: string,
  payload?: { note?: string }
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

export async function decideModification(
  id: string,
  reqId: string,
  action: "accept" | "reject"
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/modification-requests/${reqId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}
