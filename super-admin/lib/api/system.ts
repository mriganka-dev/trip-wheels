import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AnalyticsOverview,
  AnalyticsQuery,
  AuditLogItem,
  AuditLogQuery,
  DestinationAnalyticsItem,
  PlatformSettings,
  UpdateSettingsPayload,
} from "@/types/system";

export async function getSettings(): Promise<PlatformSettings> {
  return apiClient<PlatformSettings>("/admin/settings");
}

export async function updateSettings(
  payload: UpdateSettingsPayload
): Promise<PlatformSettings> {
  return apiClient<PlatformSettings>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAuditLogs(
  query: AuditLogQuery = {}
): Promise<PaginatedResponse<AuditLogItem>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.actor) searchParams.set("actor", query.actor);
  if (query.action && query.action !== "all") searchParams.set("action", query.action);
  if (query.targetType && query.targetType !== "all") {
    searchParams.set("targetType", query.targetType);
  }
  if (query.targetId) searchParams.set("targetId", query.targetId);
  if (query.from) searchParams.set("from", query.from);
  if (query.to) searchParams.set("to", query.to);

  const qs = searchParams.toString();
  return apiClient<PaginatedResponse<AuditLogItem>>(
    `/admin/audit-logs${qs ? `?${qs}` : ""}`
  );
}

export async function getAnalyticsOverview(
  query: AnalyticsQuery = {}
): Promise<AnalyticsOverview> {
  const searchParams = new URLSearchParams();
  if (query.from) searchParams.set("from", query.from);
  if (query.to) searchParams.set("to", query.to);

  const qs = searchParams.toString();
  return apiClient<AnalyticsOverview>(
    `/admin/analytics/overview${qs ? `?${qs}` : ""}`
  );
}

export async function getAnalyticsDestinations(): Promise<DestinationAnalyticsItem[]> {
  return apiClient<DestinationAnalyticsItem[]>("/admin/analytics/destinations");
}
