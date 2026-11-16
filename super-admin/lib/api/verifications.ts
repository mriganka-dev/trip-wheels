import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  RecordVerificationCallPayload,
  RejectionPayload,
  ReviewDocumentPayload,
  SuspendUserPayload,
  VerificationDetail,
  VerificationListQuery,
  VerificationQueueItem,
} from "@/types/verifications";

export async function getVerifications(
  query: VerificationListQuery = {}
): Promise<PaginatedResponse<VerificationQueueItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);
  if (query.destination && query.destination !== "all") {
    searchParams.set("destination", query.destination);
  }
  if (query.search) searchParams.set("search", query.search);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<VerificationQueueItem>>(
    `/admin/verifications${qs ? `?${qs}` : ""}`
  );
}

export async function getVerificationById(publisherId: string): Promise<VerificationDetail> {
  return apiClient<VerificationDetail>(`/admin/verifications/${publisherId}`);
}

export async function recordVerificationCall(
  publisherId: string,
  payload: RecordVerificationCallPayload
): Promise<VerificationDetail> {
  return apiClient<VerificationDetail>(
    `/admin/verifications/${publisherId}/verification-call`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function reviewDocument(
  publisherId: string,
  docId: string,
  payload: ReviewDocumentPayload
): Promise<unknown> {
  return apiClient<unknown>(
    `/admin/verifications/${publisherId}/documents/${docId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function approveVerification(publisherId: string): Promise<VerificationDetail> {
  return apiClient<VerificationDetail>(
    `/admin/verifications/${publisherId}/approve`,
    {
      method: "PATCH",
    }
  );
}

export async function rejectVerification(
  publisherId: string,
  payload: RejectionPayload
): Promise<VerificationDetail> {
  return apiClient<VerificationDetail>(
    `/admin/verifications/${publisherId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function requestReverification(
  publisherId: string,
  payload: RejectionPayload
): Promise<VerificationDetail> {
  return apiClient<VerificationDetail>(
    `/admin/verifications/${publisherId}/request-reverification`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function confirmUserPhone(userId: string): Promise<unknown> {
  return apiClient<unknown>(`/admin/users/${userId}/confirm-phone`, {
    method: "PATCH",
  });
}

export async function suspendUser(
  userId: string,
  payload: SuspendUserPayload
): Promise<unknown> {
  return apiClient<unknown>(`/admin/users/${userId}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function unsuspendUser(userId: string): Promise<unknown> {
  return apiClient<unknown>(`/admin/users/${userId}/unsuspend`, {
    method: "PATCH",
  });
}
