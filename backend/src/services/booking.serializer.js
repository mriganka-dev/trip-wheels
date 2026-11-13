import { BOOKING_STATUS, PICKUP_MODES, ROLES } from "../constants.js";

const PHONE_REVEAL_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ONGOING,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.HANDOVER_DECLINED,
  BOOKING_STATUS.NO_SHOW,
];

export const serializeBooking = (bookingDoc, viewer) => {
  if (!bookingDoc) return null;

  const b = bookingDoc.toObject
    ? bookingDoc.toObject()
    : JSON.parse(JSON.stringify(bookingDoc));

  if (!viewer) return null;

  // Admin has full view
  if (viewer.role === ROLES.ADMIN) {
    return b;
  }

  const viewerId = (viewer._id || viewer.id || "").toString();
  const customerId = (b.customer?._id || b.customer || "").toString();
  const publisherId = (b.publisher?._id || b.publisher || "").toString();

  const isCustomer = viewerId === customerId;
  const isPublisher = viewerId === publisherId;

  // If neither customer, publisher, nor admin, return minimal or null
  if (!isCustomer && !isPublisher) {
    return null;
  }

  const isPhoneRevealed = PHONE_REVEAL_STATUSES.includes(b.status);

  if (isCustomer) {
    // Redact publisher phone if not yet confirmed or if cancelled/expired/rejected
    if (b.publisher && typeof b.publisher === "object") {
      if (!isPhoneRevealed) {
        b.publisher.phone = undefined;
      }
      delete b.publisher.password;
      delete b.publisher.refreshToken;
    }

    // Pickup reveal
    if (b.pickup) {
      if (b.pickup.mode === PICKUP_MODES.FIXED) {
        // Agent pickup revealed only after confirmation
        if (b.status === BOOKING_STATUS.REQUESTED) {
          b.pickup.address = undefined;
          b.pickup.landmark = undefined;
          b.pickup.location = undefined;
        }
      } else if (b.pickup.mode === PICKUP_MODES.FLEXIBLE) {
        // Individual pickup revealed only after publisher finalizes it
        if (!b.pickup.finalizedAt) {
          b.pickup.address = undefined;
          b.pickup.landmark = undefined;
          b.pickup.location = undefined;
        }
      }
    }

    // Vehicle confirmation & private fields reveal
    const isVehicleConfirmed = Boolean(b.vehicleConfirmation?.confirmedAt);
    if (!isVehicleConfirmed) {
      if (b.vehicleConfirmation) {
        b.vehicleConfirmation.chassisNumber = undefined;
        b.vehicleConfirmation.registrationNumber = undefined;
      }
      if (b.vehicle && typeof b.vehicle === "object") {
        delete b.vehicle.chassisNumber;
        delete b.vehicle.registrationNumber;
        delete b.vehicle.insuranceDocument;
        delete b.vehicle.registrationCertificate;
        delete b.vehicle.pollutionCertificate;
      }
      if (b.assignedVehicle && typeof b.assignedVehicle === "object") {
        delete b.assignedVehicle.chassisNumber;
        delete b.assignedVehicle.registrationNumber;
        delete b.assignedVehicle.insuranceDocument;
        delete b.assignedVehicle.registrationCertificate;
        delete b.assignedVehicle.pollutionCertificate;
      }
    } else {
      // Even if confirmed, do not expose internal document attachments
      if (b.vehicle && typeof b.vehicle === "object") {
        delete b.vehicle.insuranceDocument;
        delete b.vehicle.registrationCertificate;
        delete b.vehicle.pollutionCertificate;
      }
      if (b.assignedVehicle && typeof b.assignedVehicle === "object") {
        delete b.assignedVehicle.insuranceDocument;
        delete b.assignedVehicle.registrationCertificate;
        delete b.assignedVehicle.pollutionCertificate;
      }
    }
  }

  if (isPublisher) {
    // Redact customer phone if not yet confirmed or if cancelled/expired/rejected
    if (b.customer && typeof b.customer === "object") {
      if (!isPhoneRevealed) {
        b.customer.phone = undefined;
      }
      delete b.customer.password;
      delete b.customer.refreshToken;
    }
  }

  return b;
};

export const serializeBookings = (bookings, viewer) => {
  if (!Array.isArray(bookings)) return [];
  return bookings.map((item) => serializeBooking(item, viewer)).filter(Boolean);
};
