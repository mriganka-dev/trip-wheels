import { apiClient } from "./client";
import type {
  NotificationsResponse,
} from "@/types/notification";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

export async function getNotifications(
  params?: GetNotificationsParams
): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return apiClient<NotificationsResponse>(`/notifications${query ? `?${query}` : ""}`);
}

export async function markNotificationRead(id: string): Promise<void> {
  return apiClient<void>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiClient<void>("/notifications/read-all", {
    method: "PATCH",
  });
}
