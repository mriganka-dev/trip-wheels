import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateDestinationPayload,
  DestinationItem,
  DestinationListQuery,
  UpdateDestinationPayload,
} from "@/types/destinations";

export async function getDestinations(): Promise<DestinationItem[]> {
  return apiClient<DestinationItem[]>("/destinations");
}

export async function getAdminDestinations(
  query: DestinationListQuery = {}
): Promise<PaginatedResponse<DestinationItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.isActive !== undefined) searchParams.set("isActive", String(query.isActive));

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<DestinationItem>>(
    `/admin/destinations${qs ? `?${qs}` : ""}`
  );
}

export async function createDestination(
  payload: CreateDestinationPayload
): Promise<DestinationItem> {
  return apiClient<DestinationItem>("/admin/destinations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDestination(
  id: string,
  payload: UpdateDestinationPayload
): Promise<DestinationItem> {
  return apiClient<DestinationItem>(`/admin/destinations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
