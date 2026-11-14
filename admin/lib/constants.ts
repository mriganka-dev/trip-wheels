export const APP_NAME = "Trip Wheels";
export const DASHBOARD_NAME = "Trip Wheels Partner";

export type StatusTone = "neutral" | "brand" | "warning" | "negative";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const BOOKING_STATUS_CONFIG: Record<string, StatusMeta> = {
  requested: { label: "New request", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "brand" },
  rejected: { label: "You rejected it", tone: "neutral" },
  expired: { label: "Expired, no reply", tone: "negative" },
  cancelled_by_customer: { label: "Cancelled by the customer", tone: "neutral" },
  cancelled_by_publisher: { label: "You cancelled", tone: "negative" },
  vehicle_unavailable: { label: "Vehicle reported unavailable", tone: "negative" },
  handover_declined: { label: "Handover declined", tone: "neutral" },
  no_show: { label: "Customer did not show", tone: "neutral" },
  ongoing: { label: "On trip", tone: "brand" },
  completed: { label: "Completed", tone: "neutral" },
};

export const VEHICLE_STATUS_CONFIG: Record<string, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "In review", tone: "warning" },
  active: { label: "Live", tone: "brand" },
  paused: { label: "Paused", tone: "neutral" },
  suspended: { label: "Suspended", tone: "negative" },
  rejected: { label: "Not approved", tone: "negative" },
};

export const VERIFICATION_STATUS_CONFIG: Record<string, StatusMeta> = {
  not_submitted: { label: "Not submitted", tone: "neutral" },
  pending: { label: "In review", tone: "warning" },
  approved: { label: "Approved", tone: "brand" },
  rejected: { label: "Not approved", tone: "negative" },
  reverification_required: { label: "New documents needed", tone: "warning" },
  suspended: { label: "Suspended", tone: "negative" },
};

export const VEHICLE_TYPES = [
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
] as const;

export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "cng", label: "CNG" },
] as const;

export const TRANSMISSION_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
] as const;

export const VEHICLE_CONFIRMATION_LEAD_HOURS = 24;
export const LATE_DISCLOSURE_HOURS = 24;
export const NO_SHOW_GRACE_MINUTES = 120;
export const INDIVIDUAL_MAX_VEHICLES = 2;

export function getBookingStatusMeta(status: string): StatusMeta {
  return BOOKING_STATUS_CONFIG[status] || { label: status, tone: "neutral" };
}

export function getVehicleStatusMeta(status: string): StatusMeta {
  return VEHICLE_STATUS_CONFIG[status] || { label: status, tone: "neutral" };
}

export function getVerificationStatusMeta(status: string): StatusMeta {
  return VERIFICATION_STATUS_CONFIG[status] || { label: status, tone: "neutral" };
}
