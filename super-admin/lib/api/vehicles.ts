import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminVehicleItem,
  RejectVehiclePayload,
  SuspendVehiclePayload,
  VehicleDetail,
  VehicleListQuery,
} from "@/types/vehicles";

export async function getAdminVehicles(
  query: VehicleListQuery = {}
): Promise<PaginatedResponse<AdminVehicleItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);
  if (query.destination && query.destination !== "all") {
    searchParams.set("destination", query.destination);
  }
  if (query.publisher) searchParams.set("publisher", query.publisher);
  if (query.search) searchParams.set("search", query.search);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AdminVehicleItem>>(
    `/admin/vehicles${qs ? `?${qs}` : ""}`
  );
}

export async function getAdminVehicleById(id: string): Promise<VehicleDetail> {
  return apiClient<VehicleDetail>(`/admin/vehicles/${id}`);
}

export async function approveVehicle(id: string): Promise<VehicleDetail> {
  return apiClient<VehicleDetail>(`/admin/vehicles/${id}/approve`, {
    method: "PATCH",
  });
}

export async function rejectVehicle(
  id: string,
  payload: RejectVehiclePayload
): Promise<VehicleDetail> {
  return apiClient<VehicleDetail>(`/admin/vehicles/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function suspendVehicle(
  id: string,
  payload: SuspendVehiclePayload
): Promise<VehicleDetail> {
  return apiClient<VehicleDetail>(`/admin/vehicles/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
