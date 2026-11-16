import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminUserDetailResponse,
  AdminUserItem,
  InsuranceExpiryItem,
  MisclassificationItem,
  SuspendUserPayload,
  UserListQuery,
} from "@/types/users";

export async function getAdminUsers(
  query: UserListQuery = {}
): Promise<PaginatedResponse<AdminUserItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.role && query.role !== "all") searchParams.set("role", query.role);
  if (query.accountStatus && query.accountStatus !== "all") {
    searchParams.set("accountStatus", query.accountStatus);
  }
  if (query.search) searchParams.set("search", query.search);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AdminUserItem>>(
    `/admin/users${qs ? `?${qs}` : ""}`
  );
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetailResponse> {
  return apiClient<AdminUserDetailResponse>(`/admin/users/${id}`);
}

export async function confirmUserPhone(userId: string): Promise<AdminUserItem> {
  return apiClient<AdminUserItem>(`/admin/users/${userId}/confirm-phone`, {
    method: "PATCH",
  });
}

export async function suspendUser(
  userId: string,
  payload: SuspendUserPayload
): Promise<AdminUserItem> {
  return apiClient<AdminUserItem>(`/admin/users/${userId}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function unsuspendUser(userId: string): Promise<AdminUserItem> {
  return apiClient<AdminUserItem>(`/admin/users/${userId}/unsuspend`, {
    method: "PATCH",
  });
}

// Watchlists
export async function getIndividualMisclassificationWatchlist(): Promise<
  MisclassificationItem[]
> {
  return apiClient<MisclassificationItem[]>(
    "/admin/flags/individual-misclassification"
  );
}

export async function getInsuranceExpiryWatchlist(): Promise<
  InsuranceExpiryItem[]
> {
  return apiClient<InsuranceExpiryItem[]>("/admin/watchlists/insurance-expiry");
}

// Exports
export async function downloadResourceCsv(resource: string): Promise<Blob> {
  const res = await fetch(`/api/v1/admin/export/${resource}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = `Export failed with status ${res.status}`;
    try {
      const json = await res.json();
      if (json.message) errorMsg = json.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.blob();
}
