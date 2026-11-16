import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminIssueItem,
  IssueDetail,
  IssueListQuery,
  ResolveAdminIssuePayload,
} from "@/types/issues";

export async function getAdminIssues(
  query: IssueListQuery = {}
): Promise<PaginatedResponse<AdminIssueItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);
  if (query.severity && query.severity !== "all") searchParams.set("severity", query.severity);
  if (query.from) searchParams.set("from", query.from);
  if (query.to) searchParams.set("to", query.to);
  if (query.search) searchParams.set("search", query.search);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AdminIssueItem>>(
    `/admin/issues${qs ? `?${qs}` : ""}`
  );
}

export async function getIssueById(id: string): Promise<IssueDetail> {
  return apiClient<IssueDetail>(`/issues/${id}`);
}

export async function resolveAdminIssue(
  id: string,
  payload: ResolveAdminIssuePayload
): Promise<IssueDetail> {
  return apiClient<IssueDetail>(`/admin/issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function hideReview(
  id: string,
  isHidden: boolean
): Promise<{ _id: string; isHidden: boolean }> {
  return apiClient<{ _id: string; isHidden: boolean }>(`/admin/reviews/${id}/hide`, {
    method: "PATCH",
    body: JSON.stringify({ isHidden }),
  });
}
