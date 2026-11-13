export const DB_NAME = "trip_wheels";

export const ROLES = Object.freeze({
  CUSTOMER: "customer",
  AGENT: "agent",
  INDIVIDUAL: "individual",
  ADMIN: "admin",
});

export const PUBLISHER_ROLES = Object.freeze([ROLES.AGENT, ROLES.INDIVIDUAL]);

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
});

export const VERIFICATION_STATUS = Object.freeze({
  NOT_SUBMITTED: "not_submitted",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVERIFICATION_REQUIRED: "reverification_required",
  SUSPENDED: "suspended",
});

export const DOCUMENT_TYPES = Object.freeze({
  AADHAR: "aadhar",
  PAN: "pan",
  DRIVING_LICENSE: "driving_license",
  PASPORT: "passport",
  VOTER_ID: "voter_id",
  GST_CERTIFICATE: "gst_certificate",
  BUSINESS_REGISTRATION: "business_registration",
  OTHER: "other",
});

export const DOCUMENT_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const VEHICLE_TYPES = Object.freeze({
  BIKE: "bike",
  CAR: "car",
});

export const TRANSMISSION_TYPES = Object.freeze({
  MANUAL: "manual",
  AUTOMATIC: "automatic",
});

export const FUEL_TYPES = Object.freeze({
  PETROL: "petrol",
  DIESEL: "diesel",
  ELECTRIC: "electric",
  CNG: "cng",
});

export const VEHICLE_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  ACTIVE: "active",
  PAUSED: "paused",
  SUSPENDED: "suspended",
  REJECTED: "rejected",
});

export const PICKUP_MODES = Object.freeze({
  FIXED: "fixed",
  FLEXIBLE: "flexible",
});

export const BOOKING_STATUS = Object.freeze({
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  EXPIRED: "expired",
  CANCELLED_BY_CUSTOMER: "cancelled_by_customer",
  CANCELLED_BY_PUBLISHER: "cancelled_by_publisher",
  VEHICLE_UNAVAILABLE: "vehicle_unavailable",
  HANDOVER_DECLINED: "handover_declined",
  NO_SHOW: "no_show",
  ONGOING: "ongoing",
  COMPLETED: "completed",
});

export const TERMINAL_BOOKING_STATUSES = Object.freeze([
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.EXPIRED,
  BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
  BOOKING_STATUS.CANCELLED_BY_PUBLISHER,
  BOOKING_STATUS.VEHICLE_UNAVAILABLE,
  BOOKING_STATUS.HANDOVER_DECLINED,
  BOOKING_STATUS.NO_SHOW,
  BOOKING_STATUS.COMPLETED,
]);

export const UNAVAILABILITY_REASONS = Object.freeze({
  RENTED_ELSEWHERE: "rented_elsewhere",
  MAINTENANCE: "maintenance",
  DAMAGED: "damaged",
  IN_SERVICE: "in_service",
  PERSONAL_USE: "personal_use",
  OTHER: "other",
});

export const REVIEW_DIRECTIONS = Object.freeze({
  CUSTOMER_TO_PUBLISHER: "customer_to_publisher",
  PUBLISHER_TO_CUSTOMER: "publisher_to_customer",
});

export const ISSUE_TYPES = Object.freeze({
  VEHICLE_MISMATCH: "vehicle_mismatch",
  CHASSIS_MISMATCH: "chassis_mismatch",
  REGISTRATION_MISMATCH: "registration_mismatch",
  VEHICLE_DAMAGE_UNDISCLOSED: "vehicle_damage_undisclosed",
  NOT_AS_PROMISED: "not_as_promised",
  VEHICLE_UNAVAILABLE_AT_PICKUP: "vehicle_unavailable_at_pickup",
  CUSTOMER_NO_SHOW: "customer_no_show",
  CUSTOMER_DAMAGE: "customer_damage",
  LATE_RETURN: "late_return",
  MISCONDUCT: "misconduct",
  OTHER: "other",
});

export const ISSUE_STATUS = Object.freeze({
  OPEN: "open",
  UNDER_REVIEW: "under_review",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
});

export const ISSUE_SEVERITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

export const ISSUE_RESOLUTION_OUTCOMES = Object.freeze({
  UPHELD: "upheld",
  PARTIALLY_UPHELD: "partially_upheld",
  DISMISSED: "dismissed",
});

export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: "in_app",
  PUSH: "push",
  EMAIL: "email",
  WHATSAPP: "whatsapp",
});

export const NOTIFICATION_EVENTS = Object.freeze({
  BOOKING_REQUESTED: "booking.requested",
  BOOKING_REMINDER_HALFWAY: "booking.reminder_halfway",
  BOOKING_REMINDER_FINAL: "booking.reminder_final",
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_REJECTED: "booking.rejected",
  BOOKING_EXPIRED: "booking.expired",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_VEHICLE_CONFIRMATION_DUE: "booking.vehicle_confirmation_due",
  BOOKING_VEHICLE_CONFIRMATION_REMINDER:
    "booking.vehicle_confirmation_reminder",
  BOOKING_VEHICLE_CONFIRMED: "booking.vehicle_confirmed",
  BOOKING_VEHICLE_CONFIRMATION_MISSED: "booking.vehicle_confirmation_missed",
  BOOKING_VEHICLE_UNAVAILABLE: "booking.vehicle_unavailable",
  BOOKING_PICKUP_REMINDER: "booking.pickup_reminder",
  BOOKING_HANDOVER_DECLINED: "booking.handover_declined",
  BOOKING_PICKED_UP: "booking.picked_up",
  BOOKING_OVERDUE: "booking.overdue",
  BOOKING_COMPLETED: "booking.completed",
  BOOKING_MODIFICATION_REQUESTED: "booking.modification_requested",
  BOOKING_MODIFICATION_DECIDED: "booking.modification_decided",
  ISSUE_RAISED: "issue.raised",
  ISSUE_RESPONDED: "issue.responded",
  ISSUE_RESOLVED: "issue.resolved",
  REVIEW_RECEIVED: "review.received",
  VERIFICATION_APPROVED: "verification.approved",
  VERIFICATION_REJECTED: "verification.rejected",
  VERIFICATION_REVERIFICATION_REQUIRED: "verification.reverification_required",
  VEHICLE_APPROVED: "vehicle.approved",
  VEHICLE_REJECTED: "vehicle.rejected",
  VEHICLE_INSURANCE_EXPIRING: "vehicle.insurance_expiring",
  ACCOUNT_SUSPENDED: "account.suspended",
  NOTIFICATIONS_TEST: "notifications.test",
});

export const CRITICAL_NOTIFICATION_EVENTS = Object.freeze([
  NOTIFICATION_EVENTS.BOOKING_REQUESTED,
  NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_DUE,
  NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_MISSED,
  NOTIFICATION_EVENTS.BOOKING_VEHICLE_UNAVAILABLE,
  NOTIFICATION_EVENTS.BOOKING_CONFIRMED,
  NOTIFICATION_EVENTS.BOOKING_PICKUP_REMINDER,
]);

export const ADMIN_TASK_TYPES = Object.freeze({
  CALL_PUBLISHER_NO_RESPONSE: "call_publisher_no_response",
  CALL_PUBLISHER_UNCONFIRMED_VEHICLE: "call_publisher_unconfirmed_vehicle",
  CALL_PUBLISHER_PICKUP_UNCONFIRMED: "call_publisher_pickup_unconfirmed",
  REVIEW_ISSUE: "review_issue",
  REVIEW_FLAG: "review_flag",
});

export const ADMIN_TASK_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done",
});

export const BUSINESS_DEFAULTS = Object.freeze({
  RESPONSE_WINDOW_HOURS: 4,
  MIN_BOOKING_LEAD_HOURS: 3,
  MAX_ACTIVE_REQUESTS_PER_CUSTOMER: 5,
  VEHICLE_CONFIRMATION_LEAD_HOURS: 24,
  VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: Object.freeze([24, 18, 14]),
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
  INSURANCE_EXPIRY_WARNING_DAYS: Object.freeze([30, 7, 1]),
});
