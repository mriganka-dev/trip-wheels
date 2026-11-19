import { apiClient, ApiError } from "./client";
import type {
  ChangePasswordPayload,
  CompleteProfilePayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  NotificationPreferences,
  PublisherProfile,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
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

export async function completeProfile(
  payload: CompleteProfilePayload
): Promise<User> {
  return apiClient<User>("/auth/complete-profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreferences>
): Promise<User> {
  return apiClient<User>("/users/me/notification-preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return apiClient<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
