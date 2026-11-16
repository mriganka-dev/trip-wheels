export const APP_NAME = "Trip Wheels";

export const MIN_BOOKING_LEAD_HOURS = 3;

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "rejected"
  | "expired"
  | "cancelled_by_customer"
  | "cancelled_by_publisher"
  | "vehicle_unavailable"
  | "handover_declined"
  | "no_show"
  | "ongoing"
  | "completed";

export type StatusTone = "neutral" | "positive" | "negative" | "warning";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusMeta> = {
  requested: {
    label: "Waiting for the owner",
    tone: "neutral",
  },
  confirmed: {
    label: "Confirmed",
    tone: "positive",
  },
  rejected: {
    label: "Not accepted",
    tone: "negative",
  },
  expired: {
    label: "No response from the owner",
    tone: "negative",
  },
  cancelled_by_customer: {
    label: "Cancelled by you",
    tone: "neutral",
  },
  cancelled_by_publisher: {
    label: "Cancelled by the owner",
    tone: "negative",
  },
  vehicle_unavailable: {
    label: "Vehicle not available",
    tone: "negative",
  },
  handover_declined: {
    label: "Handover declined",
    tone: "negative",
  },
  no_show: {
    label: "Marked as no show",
    tone: "negative",
  },
  ongoing: {
    label: "On trip",
    tone: "positive",
  },
  completed: {
    label: "Completed",
    tone: "neutral",
  },
};

export const VEHICLE_TYPE_LABELS = {
  bike: "Bike",
  car: "Car",
} as const;

export const FUEL_TYPE_LABELS = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  cng: "CNG",
} as const;

export const TRANSMISSION_LABELS = {
  manual: "Manual",
  automatic: "Automatic",
} as const;

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  vehicle_mismatch: "Vehicle does not match",
  chassis_mismatch: "Chassis number does not match",
  registration_mismatch: "Registration number does not match",
  vehicle_damage_undisclosed: "Damage not disclosed",
  not_as_promised: "Not as promised",
  vehicle_unavailable_at_pickup: "Vehicle not available at pickup",
  misconduct: "Owner behaviour",
  customer_no_show: "Customer no show",
  customer_damage: "Customer damage",
  late_return: "Late return",
  other: "Other",
};

export const ISSUE_STATUS_CONFIG: Record<string, StatusMeta> = {
  open: {
    label: "Open",
    tone: "warning",
  },
  under_review: {
    label: "Under Review",
    tone: "neutral",
  },
  resolved: {
    label: "Resolved",
    tone: "positive",
  },
  dismissed: {
    label: "Dismissed",
    tone: "negative",
  },
};

export const OAUTH_CUSTOMER_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled:
    "Google sign-in was cancelled. You can try again or use your email and password.",
  google_failed: "We could not sign you in with Google. Please try again.",
  google_email_unverified:
    "The email on that Google account is not verified, so it cannot be used here.",
  account_suspended: "This account is suspended. Please contact support.",
  wrong_app:
    "This email belongs to an agent or owner account, so it cannot sign in here.",
  google_unavailable:
    "Google sign-in is not available right now. Use your email and password.",
};

export const DEFAULT_OAUTH_CUSTOMER_ERROR =
  OAUTH_CUSTOMER_ERROR_MESSAGES.google_failed;



