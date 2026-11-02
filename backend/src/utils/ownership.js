import { ROLES } from "../constants.js";
import { ApiError } from "./ApiError.js";

export const isOwner = (resource, user, ownerField = "user") => {
  if (!resource || !user) return false;
  if (user.role === ROLES.ADMIN) return true;

  const rawOwner = resource[ownerField];
  const ownerId = (rawOwner?._id || rawOwner || "").toString();
  const userId = (user._id || user.id || "").toString();

  return Boolean(ownerId && userId && ownerId === userId);
};

export const assertOwnership = (
  resource,
  user,
  ownerField = "user",
  customMessage = "You do not have permission to access or modify this resource"
) => {
  if (!isOwner(resource, user, ownerField)) {
    throw new ApiError(403, customMessage);
  }
};

export const assertBookingParticipant = (
  booking,
  user,
  customMessage = "Only participants of this booking have permission to perform this action"
) => {
  if (!booking || !user) {
    throw new ApiError(403, customMessage);
  }

  if (user.role === ROLES.ADMIN) {
    return { isCustomer: false, isPublisher: false, isAdmin: true };
  }

  const userId = (user._id || user.id || "").toString();
  const customerId = (
    booking.customer?._id ||
    booking.customer ||
    ""
  ).toString();
  const publisherId = (
    booking.publisher?._id ||
    booking.publisher ||
    ""
  ).toString();

  const isCustomer = userId === customerId;
  const isPublisher = userId === publisherId;

  if (!isCustomer && !isPublisher) {
    throw new ApiError(403, customMessage);
  }

  return { isCustomer, isPublisher, isAdmin: false };
};
