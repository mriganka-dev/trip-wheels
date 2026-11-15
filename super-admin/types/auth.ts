export type UserRole = "customer" | "agent" | "individual" | "admin";
export type AccountStatus = "active" | "suspended";

export interface UserAvatar {
  url?: string;
  publicId?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: UserAvatar;
  accountStatus: AccountStatus;
  lastLoginAt?: string;
  phoneConfirmedByAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResendOtpPayload {
  email: string;
  purpose: "reset_password" | "verify_email";
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
}
