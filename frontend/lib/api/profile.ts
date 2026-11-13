import { apiClient } from "./client";
import type { User } from "@/types/auth";

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
}

export interface UpdatePreferencesPayload {
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
}

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<User> {
  return apiClient<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiClient<User>("/users/me/avatar", {
    method: "PATCH",
    body: formData,
  });
}

export async function updateNotificationPreferences(
  payload: UpdatePreferencesPayload
): Promise<User> {
  return apiClient<User>("/users/me/notification-preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

