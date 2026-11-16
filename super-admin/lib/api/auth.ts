import { apiClient } from "./client";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  ResendOtpPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
} from "@/types/auth";

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser(): Promise<void> {
  return apiClient<void>("/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/users/me");
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  return apiClient<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  return apiClient<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendOtp(payload: ResendOtpPayload): Promise<void> {
  return apiClient<void>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return apiClient<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<User> {
  return apiClient<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(formData: FormData): Promise<User> {
  return apiClient<User>("/users/me/avatar", {
    method: "PATCH",
    body: formData,
  });
}
