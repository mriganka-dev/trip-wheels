import { apiClient } from "./client";
import type { NotificationItem, NotificationListResponse } from "@/types/notifications";

export async function getNotifications(
  page: number = 1,
  limit: number = 20
): Promise<NotificationListResponse> {
  return apiClient<NotificationListResponse>(
    `/notifications?page=${page}&limit=${limit}`
  );
}

export async function markNotificationAsRead(
  id: string
): Promise<NotificationItem> {
  return apiClient<NotificationItem>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return apiClient<void>("/notifications/read-all", {
    method: "PATCH",
  });
}
