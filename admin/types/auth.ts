export type UserRole = "customer" | "agent" | "individual" | "admin";
export type AccountStatus = "active" | "suspended";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  avatar?: {
    url: string;
    publicId: string;
  };
  suspendedReason?: string;
  suspendedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected"
  | "reverification_required"
  | "suspended";

export interface PublisherProfile {
  _id: string;
  user: string | User;
  publisherType: "agent" | "individual";
  businessName?: string;
  businessAddress?: string;
  gstNumber?: string;
  agentPickup?: {
    address?: string;
    landmark?: string;
    location?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  individualArea?: {
    city?: string;
    area?: string;
    approxLocation?: {
      type: "Point";
      coordinates?: [number, number];
    };
  };
  destination?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verificationCall?: {
    done: boolean;
    doneAt?: string;
    notes?: string;
  };
  selfieWithId?: {
    url: string;
    publicId: string;
  };
  reliability?: {
    score: number;
    requestsReceived: number;
    accepted: number;
    rejected: number;
    expired: number;
    completed: number;
    cancelledAfterConfirm: number;
    noShows: number;
    issuesUpheld: number;
    lateDisclosures: number;
    undisclosedUnavailability: number;
    missedConfirmations: number;
    avgResponseMinutes: number;
  };
  ratingAvg?: number;
  ratingCount?: number;
}

export interface RegisterPayload {
  role: "agent" | "individual";
  fullName: string;
  email: string;
  phone: string;
  password: string;
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
  purpose?: "verify_email" | "reset_password";
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}
