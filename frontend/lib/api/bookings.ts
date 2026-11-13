import { apiClient } from "./client";
import type { Booking, CreateBookingPayload, MyBookingsResponse } from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";

export async function createBooking(
  payload: CreateBookingPayload,
  idempotencyKey?: string
): Promise<Booking> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers["idempotency-key"] = idempotencyKey;
  }

  return apiClient<Booking>("/bookings", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function getMyBookings(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<MyBookingsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) {
    query.set("status", status);
  }

  return apiClient<MyBookingsResponse>(`/bookings/mine?${query.toString()}`, {
    method: "GET",
  });
}

export async function getBookingById(id: string): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}`, {
    method: "GET",
  });
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function getBackupVehicles(id: string): Promise<Vehicle[]> {
  return apiClient<Vehicle[]>(`/bookings/${id}/backups`, {
    method: "GET",
  });
}

export async function requestBookingModification(
  id: string,
  payload: { newStartAt: string; newEndAt: string }
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/modification-requests`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function markBookingPickedUp(id: string): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/mark-picked-up`, {
    method: "PATCH",
  });
}

export async function completeBooking(
  id: string,
  note?: string
): Promise<Booking> {
  return apiClient<Booking>(`/bookings/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

