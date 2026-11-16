import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type { AdminTask, TaskListQuery, UpdateTaskPayload } from "@/types/tasks";

export async function getAdminTasks(
  query: TaskListQuery = {}
): Promise<PaginatedResponse<AdminTask>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.status && query.status !== "all") searchParams.set("status", query.status);
  if (query.type && query.type !== "all") searchParams.set("type", query.type);

  const qs = searchParams.toString();
  const endpoint = `/admin/tasks${qs ? `?${qs}` : ""}`;
  return apiClient<PaginatedResponse<AdminTask>>(endpoint);
}

export async function updateAdminTask(
  taskId: string,
  payload: UpdateTaskPayload
): Promise<AdminTask> {
  return apiClient<AdminTask>(`/admin/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
