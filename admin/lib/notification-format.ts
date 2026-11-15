import type { NotificationItem } from "@/types/notification";

export interface FormattedNotification {
  title: string;
  body: string;
  href: string;
}

export function formatNotification(notification: NotificationItem): FormattedNotification {
  const { event, title, body, data } = notification;

  let href = "/notifications";

  if (data?.bookingId) {
    href = `/bookings/${data.bookingId}`;
  } else if (data?.issueId) {
    href = `/issues/${data.issueId}`;
  } else if (data?.vehicleId) {
    href = `/vehicles/${data.vehicleId}`;
  } else if (event.startsWith("verification.")) {
    href = "/verification";
  } else if (event.startsWith("review.")) {
    href = "/reviews";
  } else if (event.startsWith("vehicle.")) {
    href = "/vehicles";
  }

  // Event titles mapping
  const titles: Record<string, string> = {
    "booking.requested": "New booking request",
    "booking.reminder_halfway": "Response reminder: request waiting",
    "booking.reminder_final": "Urgent: response deadline near",
    "booking.confirmed": "Booking confirmed",
    "booking.rejected": "Booking request declined",
    "booking.expired": "Request expired",
    "booking.cancelled": "Booking cancelled",
    "booking.vehicle_confirmation_due": "Vehicle confirmation due",
    "booking.vehicle_confirmation_reminder": "Vehicle confirmation reminder",
    "booking.vehicle_confirmed": "Vehicle confirmed",
    "booking.vehicle_confirmation_missed": "Vehicle confirmation deadline missed",
    "booking.vehicle_unavailable": "Vehicle reported unavailable",
    "booking.pickup_reminder": "Pickup reminder: 3 hours left",
    "booking.handover_declined": "Handover declined",
    "booking.picked_up": "Vehicle handed over to customer",
    "booking.overdue": "Booking return overdue",
    "booking.completed": "Trip completed",
    "booking.modification_requested": "Customer requested date change",
    "booking.modification_decided": "Date change updated",
    "issue.raised": "Issue reported",
    "issue.responded": "Response added to issue",
    "issue.resolved": "Issue resolved",
    "review.received": "New review received",
    "verification.approved": "Verification approved",
    "verification.rejected": "Verification declined",
    "verification.reverification_required": "Re-verification required",
    "vehicle.approved": "Vehicle approved",
    "vehicle.rejected": "Vehicle approval declined",
    "vehicle.insurance_expiring": "Insurance expiring soon",
    "account.suspended": "Account status update",
    "notifications.test": "Test notification received",
  };

  return {
    title: title || titles[event] || "Partner Alert",
    body: body || "",
    href,
  };
}
