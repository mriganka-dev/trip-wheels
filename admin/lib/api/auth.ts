import { apiClient, ApiError } from "./client";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  PublisherProfile,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  User,
  VerifyEmailPayload,
} from "@/types/auth";

export async function registerUser(payload: RegisterPayload): Promise<User> {
  return apiClient<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<User> {
  return apiClient<User>("/auth/verify-email", {
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

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/users/me");
}

export async function getPublisherProfile(): Promise<PublisherProfile | null> {
  try {
    return await apiClient<PublisherProfile>("/publishers/profile/me");
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
