import { apiClient } from "./client";
import { serverFetch } from "./server";
import type {
  SearchVehiclesData,
  SearchVehiclesParams,
  Vehicle,
} from "@/types/vehicle";

export async function searchVehicles(
  params: SearchVehiclesParams
): Promise<SearchVehiclesData> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  return apiClient<SearchVehiclesData>(`/vehicles/search?${query.toString()}`, {
    method: "GET",
  });
}

export async function getVehicleDetail(id: string): Promise<Vehicle> {
  return apiClient<Vehicle>(`/vehicles/${id}`, {
    method: "GET",
  });
}

export async function serverGetVehicleDetail(id: string): Promise<Vehicle> {
  return serverFetch<Vehicle>(`/vehicles/${id}`, {
    method: "GET",
    revalidate: 60,
  });
}

export async function checkVehicleAvailability(
  id: string,
  from: string,
  to: string
): Promise<{ isAvailable: boolean; reason?: string; conflictingBookingId?: string }> {
  const query = new URLSearchParams({ from, to });
  return apiClient<{ isAvailable: boolean; reason?: string }>(
    `/vehicles/${id}/availability?${query.toString()}`,
    {
      method: "GET",
    }
  );
}

