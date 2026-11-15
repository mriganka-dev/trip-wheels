import { apiClient } from "./client";
import type {
  Issue,
  PaginatedIssuesResponse,
} from "@/types/issue";

export interface GetIssuesParams {
  status?: string;
  type?: string;
  severity?: string;
  page?: number;
  limit?: number;
}

export async function getMyIssues(
  params?: GetIssuesParams
): Promise<PaginatedIssuesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params?.type && params.type !== "all") {
    searchParams.set("type", params.type);
  }
  if (params?.severity && params.severity !== "all") {
    searchParams.set("severity", params.severity);
  }
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return apiClient<PaginatedIssuesResponse>(`/issues/mine${query ? `?${query}` : ""}`);
}

export async function getIssue(id: string): Promise<Issue> {
  return apiClient<Issue>(`/issues/${id}`);
}

export async function respondToIssue(id: string, text: string): Promise<Issue> {
  return apiClient<Issue>(`/issues/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function raiseIssue(
  bookingId: string,
  formData: FormData
): Promise<Issue> {
  return apiClient<Issue>(`/bookings/${bookingId}/issues`, {
    method: "POST",
    body: formData,
  });
}
