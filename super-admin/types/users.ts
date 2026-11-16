export type UserRole = "customer" | "agent" | "individual" | "admin";
export type AccountStatus = "active" | "suspended";

export interface UserReliability {
  score: number;
  cancellations: number;
  noShows: number;
  issuesUpheld: number;
  completedBookings: number;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface AdminUserItem {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  phoneConfirmedByAdmin?: boolean;
  phoneConfirmedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetailResponse {
  user: AdminUserItem & {
    suspendedReason?: string;
    suspendedAt?: string | null;
    reliability?: UserReliability;
  };
  profile?: {
    _id: string;
    publisherType: "agent" | "individual";
    businessName?: string;
    businessAddress?: string;
    gstNumber?: string;
    verificationStatus: string;
    reliability?: {
      score: number;
      requestsReceived?: number;
      accepted?: number;
      rejected?: number;
      expired?: number;
      completed?: number;
      cancelledAfterConfirm?: number;
      noShows?: number;
      issuesUpheld?: number;
      lateDisclosures?: number;
      undisclosedUnavailability?: number;
      missedConfirmations?: number;
      ratingAvg?: number;
      ratingCount?: number;
    };
  } | null;
  documents?: Array<{
    _id: string;
    type: string;
    status: string;
    documentNumber?: string;
    remarks?: string;
  }>;
  vehicles?: Array<{
    _id: string;
    brand: string;
    model: string;
    type: string;
    registrationNumber: string;
    status: string;
    year?: number;
  }>;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: string;
  accountStatus?: string;
  search?: string;
}

export interface SuspendUserPayload {
  reason: string;
}

// Watchlist Types
export interface MisclassificationItem {
  publisher: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    accountStatus: string;
  };
  profileId: string;
  vehicleCount: number;
  completedTrips30d: number;
  reasons: string[];
}

export interface InsuranceExpiryItem {
  _id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  status: string;
  insurancePolicyNumber: string;
  insuranceExpiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  publisher?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  destination?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
}
