export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneConfirmedByAdmin?: boolean;
  phoneConfirmedAt?: string;
  role: "customer" | "agent" | "individual" | "admin";
  avatar?: {
    url: string;
    publicId: string;
  };
  isEmailVerified: boolean;
  accountStatus: "active" | "suspended";
  suspendedReason?: string;
  suspendedAt?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  reliability?: {
    score: number;
    cancellations: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: "customer";
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
  purpose: "verify_email" | "reset_password";
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

