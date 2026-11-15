import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type { VerificationListQuery, VerificationQueueItem } from "@/types/verifications";

export async function getVerifications(
  query: VerificationListQuery = {}
): Promise<PaginatedResponse<VerificationQueueItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);
  if (query.search) searchParams.set("search", query.search);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<VerificationQueueItem>>(
    `/admin/verifications${qs ? `?${qs}` : ""}`
  );
}
