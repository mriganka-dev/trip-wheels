import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type { AdminVehicleItem, VehicleListQuery } from "@/types/vehicles";

export async function getAdminVehicles(
  query: VehicleListQuery = {}
): Promise<PaginatedResponse<AdminVehicleItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AdminVehicleItem>>(
    `/admin/vehicles${qs ? `?${qs}` : ""}`
  );
}
