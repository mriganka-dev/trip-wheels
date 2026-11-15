import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type { AdminIssueItem, IssueListQuery } from "@/types/issues";

export async function getAdminIssues(
  query: IssueListQuery = {}
): Promise<PaginatedResponse<AdminIssueItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);
  if (query.severity && query.severity !== "all") searchParams.set("severity", query.severity);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AdminIssueItem>>(
    `/admin/issues${qs ? `?${qs}` : ""}`
  );
}
