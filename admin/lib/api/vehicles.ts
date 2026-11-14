import { apiClient } from "./client";
import type {
  CreateVehiclePayload,
  PaginatedVehiclesResponse,
  UpdateVehiclePayload,
  UploadVehicleDocumentsPayload,
  Vehicle,
} from "@/types/vehicle";

export interface GetMyVehiclesParams {
  status?: string;
  page?: number;
  limit?: number;
}

export async function getMyVehicles(
  params?: GetMyVehiclesParams
): Promise<PaginatedVehiclesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params?.page) {
    searchParams.set("page", String(params.page));
  }
  if (params?.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const endpoint = `/vehicles/mine${query ? `?${query}` : ""}`;
  return apiClient<PaginatedVehiclesResponse>(endpoint);
}

export async function getVehicle(id: string): Promise<Vehicle> {
  // Query publisher's own list first so draft, in review, and paused vehicles resolve
  try {
    const res = await getMyVehicles({ limit: 100 });
    const match = res.items.find((item) => item._id === id);
    if (match) {
      return match;
    }
  } catch {
    // Fall back to direct fetch if getMyVehicles fails
  }

  return apiClient<Vehicle>(`/vehicles/${id}`);
}

export async function createVehicle(
  payload: CreateVehiclePayload
): Promise<Vehicle> {
  return apiClient<Vehicle>("/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(
  id: string,
  payload: UpdateVehiclePayload
): Promise<Vehicle> {
  return apiClient<Vehicle>(`/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadVehicleImages(
  id: string,
  files: File[]
): Promise<Vehicle> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  return apiClient<Vehicle>(`/vehicles/${id}/images`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteVehicleImage(
  id: string,
  imageId: string
): Promise<Vehicle> {
  return apiClient<Vehicle>(`/vehicles/${id}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function uploadVehicleDocuments(
  id: string,
  payload: UploadVehicleDocumentsPayload
): Promise<Vehicle> {
  const formData = new FormData();
  formData.append("chassisNumber", payload.chassisNumber.trim());
  formData.append(
    "registrationNumber",
    payload.registrationNumber.trim().toUpperCase()
  );
  formData.append("rcOwnerName", payload.rcOwnerName.trim());
  formData.append("insurancePolicyNumber", payload.insurancePolicyNumber.trim());
  formData.append("insuranceExpiresAt", payload.insuranceExpiresAt);

  if (payload.rc) {
    formData.append("rc", payload.rc);
  }
  if (payload.insurance) {
    formData.append("insurance", payload.insurance);
  }
  if (payload.noc) {
    formData.append("noc", payload.noc);
  }

  return apiClient<Vehicle>(`/vehicles/${id}/documents`, {
    method: "POST",
    body: formData,
  });
}

export async function submitVehicle(id: string): Promise<Vehicle> {
  return apiClient<Vehicle>(`/vehicles/${id}/submit`, {
    method: "POST",
  });
}

export async function pauseVehicle(id: string): Promise<Vehicle> {
  return apiClient<Vehicle>(`/vehicles/${id}/pause`, {
    method: "PATCH",
  });
}

export async function resumeVehicle(id: string): Promise<Vehicle> {
  return apiClient<Vehicle>(`/vehicles/${id}/resume`, {
    method: "PATCH",
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient<void>(`/vehicles/${id}`, {
    method: "DELETE",
  });
}
