import { apiClient } from "./client";
import type { Issue, IssuesListResponse } from "@/types/issue";

export async function createIssue(
  bookingId: string,
  formData: FormData
): Promise<Issue> {
  return apiClient<Issue>(`/bookings/${bookingId}/issues`, {
    method: "POST",
    body: formData,
  });
}

export async function getMyIssues(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<IssuesListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) {
    query.set("status", status);
  }

  return apiClient<IssuesListResponse>(`/issues/mine?${query.toString()}`, {
    method: "GET",
  });
}

export async function getIssueById(id: string): Promise<Issue> {
  return apiClient<Issue>(`/issues/${id}`, {
    method: "GET",
  });
}

export async function respondToIssue(
  id: string,
  text: string
): Promise<Issue> {
  return apiClient<Issue>(`/issues/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

