import { apiClient } from "./client";
import type { AppNotification, NotificationsResponse } from "@/types/notification";

export async function getNotifications(
  page: number = 1,
  limit: number = 20
): Promise<NotificationsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiClient<NotificationsResponse>(`/notifications?${query.toString()}`, {
    method: "GET",
  });
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  return apiClient<AppNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiClient<void>("/notifications/read-all", {
    method: "PATCH",
  });
}

