export interface PlatformSettings {
  _id?: string;
  key?: string;
  RESPONSE_WINDOW_HOURS: number;
  MIN_BOOKING_LEAD_HOURS: number;
  MAX_ACTIVE_REQUESTS_PER_CUSTOMER: number;
  VEHICLE_CONFIRMATION_LEAD_HOURS: number;
  VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: number[];
  VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: number;
  LATE_DISCLOSURE_HOURS: number;
  PRE_PICKUP_REMINDER_HOURS_BEFORE: number;
  NO_SHOW_GRACE_MINUTES: number;
  AUTO_COMPLETE_GRACE_HOURS: number;
  INDIVIDUAL_MAX_VEHICLES: number;
  OTP_EXPIRY_MINUTES: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RESEND_COOLDOWN_SECONDS: number;
  OTP_MAX_PER_HOUR: number;
  REVIEW_WINDOW_DAYS: number;
  ISSUE_WINDOW_DAYS_AFTER_COMPLETION: number;
  INSURANCE_EXPIRY_WARNING_DAYS: number[];
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateSettingsPayload = Partial<
  Omit<PlatformSettings, "_id" | "key" | "createdAt" | "updatedAt">
>;

export const DEFAULT_BUSINESS_SETTINGS: PlatformSettings = {
  RESPONSE_WINDOW_HOURS: 4,
  MIN_BOOKING_LEAD_HOURS: 3,
  MAX_ACTIVE_REQUESTS_PER_CUSTOMER: 5,
  VEHICLE_CONFIRMATION_LEAD_HOURS: 24,
  VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: [24, 18, 14],
  VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: 12,
  LATE_DISCLOSURE_HOURS: 24,
  PRE_PICKUP_REMINDER_HOURS_BEFORE: 3,
  NO_SHOW_GRACE_MINUTES: 120,
  AUTO_COMPLETE_GRACE_HOURS: 6,
  INDIVIDUAL_MAX_VEHICLES: 2,
  OTP_EXPIRY_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  OTP_MAX_PER_HOUR: 5,
  REVIEW_WINDOW_DAYS: 14,
  ISSUE_WINDOW_DAYS_AFTER_COMPLETION: 7,
  INSURANCE_EXPIRY_WARNING_DAYS: [30, 7, 1],
};

export interface AuditActor {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AuditLogItem {
  _id: string;
  actor: AuditActor | string;
  action: string;
  targetType: string;
  targetId?: string | number | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  actor?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
}

export interface AnalyticsOverview {
  dateRange: {
    from: string;
    to: string;
  };
  requestsCreated: number;
  acceptanceRate: number;
  rejectionRate: number;
  expiryRate: number;
  avgResponseMinutes: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  vehicleConfirmationMissedRate: number;
  lateDisclosureRate: number;
  issueRate: number;
  avgIssueResolutionHours: number;
  activePublishers: number;
  activeVehicles: number;
}

export interface DestinationSummary {
  _id: string;
  name: string;
  slug: string;
  state: string;
}

export interface DestinationAnalyticsItem {
  destination: DestinationSummary;
  totalRequests: number;
  completedBookings: number;
  activeVehicles: number;
}

export interface AnalyticsQuery {
  from?: string;
  to?: string;
}
