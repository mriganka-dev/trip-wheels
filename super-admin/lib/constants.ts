export const APP_NAME = "Trip Wheels";
export const DASHBOARD_NAME = "Trip Wheels Super Admin";
export const IDLE_TIMEOUT_MINUTES = 30;

export type StatusTone = "brand" | "warning" | "negative" | "neutral";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const VERIFICATION_STATUS_META: Record<string, StatusMeta> = {
  not_submitted: { label: "Not submitted", tone: "neutral" },
  pending: { label: "Waiting for review", tone: "warning" },
  approved: { label: "Approved", tone: "brand" },
  rejected: { label: "Not approved", tone: "negative" },
  reverification_required: { label: "New documents needed", tone: "warning" },
  suspended: { label: "Suspended", tone: "negative" },
};

export const VEHICLE_STATUS_META: Record<string, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "Waiting for review", tone: "warning" },
  active: { label: "Live", tone: "brand" },
  paused: { label: "Paused", tone: "neutral" },
  suspended: { label: "Suspended", tone: "negative" },
  rejected: { label: "Not approved", tone: "negative" },
};

export const BOOKING_STATUS_META: Record<string, StatusMeta> = {
  requested: { label: "Requested", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "brand" },
  rejected: { label: "Rejected by owner", tone: "negative" },
  expired: { label: "Expired", tone: "neutral" },
  cancelled_by_customer: { label: "Cancelled by customer", tone: "neutral" },
  cancelled_by_publisher: { label: "Cancelled by owner", tone: "negative" },
  vehicle_unavailable: { label: "Vehicle unavailable", tone: "negative" },
  handover_declined: { label: "Handover declined", tone: "negative" },
  no_show: { label: "No show", tone: "negative" },
  ongoing: { label: "On trip", tone: "brand" },
  completed: { label: "Completed", tone: "neutral" },
};

export const ISSUE_STATUS_META: Record<string, StatusMeta> = {
  open: { label: "Open", tone: "warning" },
  under_review: { label: "Under review", tone: "warning" },
  resolved: { label: "Resolved", tone: "brand" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

export const TASK_STATUS_META: Record<string, StatusMeta> = {
  open: { label: "Open", tone: "warning" },
  in_progress: { label: "In progress", tone: "brand" },
  done: { label: "Done", tone: "neutral" },
};

export const SEVERITY_META: Record<string, StatusMeta> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "negative" },
  critical: { label: "Critical", tone: "negative" },
};

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  vehicle_mismatch: "Vehicle does not match",
  chassis_mismatch: "Chassis number does not match",
  registration_mismatch: "Registration number does not match",
  vehicle_damage_undisclosed: "Damage not disclosed",
  not_as_promised: "Not as promised",
  vehicle_unavailable_at_pickup: "Vehicle not available at pickup",
  customer_no_show: "Customer no show",
  customer_damage: "Damage by customer",
  late_return: "Late return",
  misconduct: "Misconduct",
  other: "Other",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  call_publisher_no_response: "Call: owner not replying to requests",
  call_publisher_unconfirmed_vehicle: "Call: vehicle not confirmed",
  call_publisher_pickup_unconfirmed: "Call: pickup not confirmed",
  review_issue: "Review an issue",
  review_flag: "Review a flag",
};

export function getVerificationStatusMeta(status: string): StatusMeta {
  return VERIFICATION_STATUS_META[status] || { label: status, tone: "neutral" };
}

export function getVehicleStatusMeta(status: string): StatusMeta {
  return VEHICLE_STATUS_META[status] || { label: status, tone: "neutral" };
}

export function getBookingStatusMeta(status: string): StatusMeta {
  return BOOKING_STATUS_META[status] || { label: status, tone: "neutral" };
}

export function getIssueStatusMeta(status: string): StatusMeta {
  return ISSUE_STATUS_META[status] || { label: status, tone: "neutral" };
}

export function getTaskStatusMeta(status: string): StatusMeta {
  return TASK_STATUS_META[status] || { label: status, tone: "neutral" };
}

export function getSeverityMeta(severity: string): StatusMeta {
  return SEVERITY_META[severity] || { label: severity, tone: "neutral" };
}

export function getIssueTypeLabel(type: string): string {
  return ISSUE_TYPE_LABELS[type] || type;
}

export function getTaskTypeLabel(type: string): string {
  return TASK_TYPE_LABELS[type] || type;
}
