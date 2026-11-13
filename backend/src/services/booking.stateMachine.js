import { BOOKING_STATUS, TERMINAL_BOOKING_STATUSES } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";

const VALID_TRANSITIONS = {
  [BOOKING_STATUS.REQUESTED]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.EXPIRED,
    BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
    BOOKING_STATUS.CANCELLED_BY_PUBLISHER,
    BOOKING_STATUS.VEHICLE_UNAVAILABLE,
    BOOKING_STATUS.HANDOVER_DECLINED,
    BOOKING_STATUS.NO_SHOW,
    BOOKING_STATUS.ONGOING,
  ],
  [BOOKING_STATUS.ONGOING]: [BOOKING_STATUS.COMPLETED],
  // Terminal statuses have no standard transitions
  [BOOKING_STATUS.REJECTED]: [],
  [BOOKING_STATUS.EXPIRED]: [],
  [BOOKING_STATUS.CANCELLED_BY_CUSTOMER]: [],
  [BOOKING_STATUS.CANCELLED_BY_PUBLISHER]: [],
  [BOOKING_STATUS.VEHICLE_UNAVAILABLE]: [],
  [BOOKING_STATUS.HANDOVER_DECLINED]: [],
  [BOOKING_STATUS.NO_SHOW]: [],
  [BOOKING_STATUS.COMPLETED]: [],
};

export const canTransition = (currentStatus, targetStatus) => {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true;

  const allowed = VALID_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
};

export const validateTransition = (currentStatus, targetStatus) => {
  if (!canTransition(currentStatus, targetStatus)) {
    throw new ApiError(
      400,
      `Invalid booking status transition from '${currentStatus}' to '${targetStatus}'`
    );
  }
};

export const isTerminalStatus = (status) => {
  return TERMINAL_BOOKING_STATUSES.includes(status);
};

export const transitionBookingStatus = (
  booking,
  targetStatus,
  userId = null,
  note = ""
) => {
  validateTransition(booking.status, targetStatus);

  booking.status = targetStatus;
  booking.statusHistory.push({
    status: targetStatus,
    at: new Date(),
    by: userId,
    note: note || "",
  });

  return booking;
};
