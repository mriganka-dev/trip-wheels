import { NOTIFICATION_EVENTS } from "../constants.js";

export const templates = {
  // Booking events
  [NOTIFICATION_EVENTS.BOOKING_REQUESTED]: {
    title: () => "New Booking Request Received",
    body: (d) =>
      `You received a new booking request for ${d.vehicleName || "your vehicle"}. Please accept or reject within the response window.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_REMINDER_HALFWAY]: {
    title: () => "Booking Request Awaiting Response",
    body: (d) =>
      `Half of your response window has passed for booking request #${d.bookingCode || ""}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_REMINDER_FINAL]: {
    title: () => "Urgent: Booking Request Expiring Soon",
    body: (d) =>
      `Your booking request #${d.bookingCode || ""} will expire in 30 minutes if not answered.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_CONFIRMED]: {
    title: () => "Booking Confirmed",
    body: (d) =>
      `Your booking request #${d.bookingCode || ""} has been accepted by the vehicle publisher.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_REJECTED]: {
    title: () => "Booking Request Declined",
    body: (d) =>
      `Your booking request #${d.bookingCode || ""} was declined by the vehicle publisher.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_EXPIRED]: {
    title: () => "Booking Request Expired",
    body: (d) =>
      `Booking request #${d.bookingCode || ""} expired because it was not answered in time.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_CANCELLED]: {
    title: () => "Booking Cancelled",
    body: (d) =>
      `Booking #${d.bookingCode || ""} was cancelled by ${d.cancelledBy || "the other party"}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_DUE]: {
    title: () => "Vehicle Confirmation Due",
    body: (d) =>
      `Please confirm the vehicle assignment and registration details for booking #${d.bookingCode || ""}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_REMINDER]: {
    title: () => "Reminder: Vehicle Confirmation Required",
    body: (d) =>
      `Reminder to submit vehicle details for upcoming booking #${d.bookingCode || ""}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMED]: {
    title: () => "Vehicle Details Confirmed",
    body: (d) =>
      `The vehicle details for your trip #${d.bookingCode || ""} are now confirmed and available.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_MISSED]: {
    title: () => "Vehicle Confirmation Missed",
    body: (d) =>
      `The confirmation deadline for booking #${d.bookingCode || ""} has passed. Support has been alerted.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_VEHICLE_UNAVAILABLE]: {
    title: () => "Vehicle Reported Unavailable",
    body: (d) =>
      `The assigned vehicle for booking #${d.bookingCode || ""} was reported unavailable. Review alternative options.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_PICKUP_REMINDER]: {
    title: () => "Trip Pickup Reminder",
    body: (d) =>
      `Your booking #${d.bookingCode || ""} starts in 3 hours. Please prepare for pickup.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_HANDOVER_DECLINED]: {
    title: () => "Handover Declined",
    body: (d) =>
      `Vehicle handover for booking #${d.bookingCode || ""} was declined due to verification failure.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_PICKED_UP]: {
    title: () => "Vehicle Handover Completed",
    body: (d) =>
      `Trip #${d.bookingCode || ""} is now active. Have a safe journey.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_OVERDUE]: {
    title: () => "Vehicle Return Overdue",
    body: (d) =>
      `The scheduled return time for booking #${d.bookingCode || ""} has passed. Please return the vehicle promptly.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_COMPLETED]: {
    title: () => "Trip Completed",
    body: (d) =>
      `Booking #${d.bookingCode || ""} has been completed. Please take a moment to leave a review.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_MODIFICATION_REQUESTED]: {
    title: () => "Booking Modification Requested",
    body: (d) =>
      `A change of dates was requested for booking #${d.bookingCode || ""}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },
  [NOTIFICATION_EVENTS.BOOKING_MODIFICATION_DECIDED]: {
    title: () => "Booking Modification Update",
    body: (d) =>
      `The modification request for booking #${d.bookingCode || ""} has been ${d.decision || "updated"}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}`,
  },

  // Trust events
  [NOTIFICATION_EVENTS.ISSUE_RAISED]: {
    title: () => "Issue Raised on Booking",
    body: (d) =>
      `An issue has been reported for booking #${d.bookingCode || ""}: ${d.reason || ""}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}/issues`,
  },
  [NOTIFICATION_EVENTS.ISSUE_RESPONDED]: {
    title: () => "Response to Booking Issue",
    body: (d) =>
      `A response was added to the issue on booking #${d.bookingCode || ""}.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}/issues`,
  },
  [NOTIFICATION_EVENTS.ISSUE_RESOLVED]: {
    title: () => "Booking Issue Resolved",
    body: (d) =>
      `The issue on booking #${d.bookingCode || ""} has been marked as resolved.`,
    deepLink: (d) => `/bookings/${d.bookingId || ""}/issues`,
  },
  [NOTIFICATION_EVENTS.REVIEW_RECEIVED]: {
    title: () => "New Review Received",
    body: (d) =>
      `You received a new rating and review for ${d.vehicleName || "your vehicle"}.`,
    deepLink: (d) => `/vehicles/${d.vehicleId || ""}`,
  },

  // Verification & listings
  [NOTIFICATION_EVENTS.VERIFICATION_APPROVED]: {
    title: () => "Publisher Profile Approved",
    body: () =>
      "Your publisher profile has been verified and approved. You can now list vehicles on Trip Wheels.",
    deepLink: () => "/publishers/profile/me",
  },
  [NOTIFICATION_EVENTS.VERIFICATION_REJECTED]: {
    title: () => "Publisher Verification Update",
    body: (d) =>
      `Your publisher profile verification was rejected: ${d.reason || "Please review your submitted documents."}`,
    deepLink: () => "/publishers/profile/me",
  },
  [NOTIFICATION_EVENTS.VERIFICATION_REVERIFICATION_REQUIRED]: {
    title: () => "Reverification Requested",
    body: (d) =>
      `Additional verification is required for your publisher profile: ${d.reason || ""}.`,
    deepLink: () => "/publishers/profile/me",
  },
  [NOTIFICATION_EVENTS.VEHICLE_APPROVED]: {
    title: () => "Vehicle Listing Approved",
    body: (d) =>
      `Your listing for ${d.vehicleName || "your vehicle"} has been approved and is now active for bookings.`,
    deepLink: (d) => `/vehicles/${d.vehicleId || ""}`,
  },
  [NOTIFICATION_EVENTS.VEHICLE_REJECTED]: {
    title: () => "Vehicle Listing Rejected",
    body: (d) =>
      `Your vehicle listing was not approved: ${d.reason || ""}. Please update the listing and resubmit.`,
    deepLink: (d) => `/vehicles/${d.vehicleId || ""}`,
  },
  [NOTIFICATION_EVENTS.VEHICLE_INSURANCE_EXPIRING]: {
    title: () => "Vehicle Insurance Expiring Soon",
    body: (d) =>
      `Insurance for ${d.vehicleName || "your vehicle"} will expire in ${d.daysRemaining || ""} days. Renew to keep the listing active.`,
    deepLink: (d) => `/vehicles/${d.vehicleId || ""}`,
  },
  [NOTIFICATION_EVENTS.ACCOUNT_SUSPENDED]: {
    title: () => "Account Suspended",
    body: (d) =>
      `Your Trip Wheels account has been suspended: ${d.reason || "Violation of platform policies."}`,
    deepLink: () => "/support",
  },

  // System
  [NOTIFICATION_EVENTS.NOTIFICATIONS_TEST]: {
    title: () => "Trip Wheels Test Notification",
    body: () =>
      "This is a test notification confirming your device and alert channels are working correctly.",
    deepLink: () => "/notifications",
  },
};

export const renderNotification = (event, data = {}) => {
  const template = templates[event];

  if (!template) {
    return {
      title: "Trip Wheels Notification",
      body: `Notification event: ${event}`,
      deepLink: "/notifications",
    };
  }

  return {
    title: template.title(data),
    body: template.body(data),
    deepLink: template.deepLink(data),
  };
};
