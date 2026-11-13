import { apiClient } from "./client";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  User,
  VerifyEmailPayload,
} from "@/types/auth";

export async function registerUser(payload: Omit<RegisterPayload, "role">): Promise<User> {
  return apiClient<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      role: "customer",
    }),
  });
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<User> {
  return apiClient<User>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendOtp(payload: ResendOtpPayload): Promise<null> {
  return apiClient<null>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser(): Promise<null> {
  return apiClient<null>("/auth/logout", {
    method: "POST",
  });
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<null> {
  return apiClient<null>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<null> {
  return apiClient<null>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/users/me", {
    method: "GET",
  });
}

