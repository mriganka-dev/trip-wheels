import mongoose from "mongoose";
import {
  ADMIN_TASK_TYPES,
  BOOKING_STATUS,
  BUSINESS_DEFAULTS,
  NOTIFICATION_EVENTS,
  PICKUP_MODES,
  ROLES,
  TERMINAL_BOOKING_STATUSES,
  UNAVAILABILITY_REASONS,
  VEHICLE_STATUS,
} from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { Booking } from "../models/booking.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { VehicleUnavailability } from "../models/vehicleUnavailability.model.js";
import { notify } from "../notifications/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import { generateBookingCode } from "../utils/counter.js";
import { getHoursDifference } from "../utils/dates.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";
import { logAudit } from "./audit.service.js";
import { serializeBooking, serializeBookings } from "./booking.serializer.js";
import { transitionBookingStatus } from "./booking.stateMachine.js";

export const createBookingRequest = async (customer, data, options = {}) => {
  const customerId = customer._id;

  if (customer.role !== ROLES.CUSTOMER) {
    throw new ApiError(403, "Only customers can create booking requests");
  }

  if (!customer.isEmailVerified) {
    throw new ApiError(
      403,
      "Email must be verified to create booking requests"
    );
  }

  // Idempotency check if header provided
  if (options.idempotencyKey) {
    const existing = await Booking.findOne({
      customer: customerId,
      idempotencyKey: options.idempotencyKey,
    })
      .populate("customer", "fullName phone reliability email")
      .populate("publisher", "fullName phone email")
      .populate("vehicle", "brand model type pricing pickup");

    if (existing) {
      return serializeBooking(existing, customer);
    }
  }

  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);
  const now = new Date();

  const leadHours = getHoursDifference(now, startAt);
  if (leadHours < BUSINESS_DEFAULTS.MIN_BOOKING_LEAD_HOURS) {
    throw new ApiError(
      400,
      `Pickup time must be at least ${BUSINESS_DEFAULTS.MIN_BOOKING_LEAD_HOURS} hours from now`
    );
  }

  const durationHours = Math.ceil(getHoursDifference(startAt, endAt));
  if (durationHours <= 0) {
    throw new ApiError(400, "endAt must be strictly after startAt");
  }

  const vehicle = await Vehicle.findById(data.vehicleId).select(
    "+chassisNumber +registrationNumber"
  );
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (vehicle.status !== VEHICLE_STATUS.ACTIVE) {
    throw new ApiError(400, "Vehicle is currently not available for bookings");
  }

  if (String(vehicle.publisher) === String(customerId)) {
    throw new ApiError(400, "You cannot book your own vehicle");
  }

  if (durationHours < (vehicle.pricing?.minRentalHours || 1)) {
    throw new ApiError(
      400,
      `Minimum rental duration for this vehicle is ${vehicle.pricing?.minRentalHours || 1} hours`
    );
  }

  // Active requests limit
  const activeRequestsCount = await Booking.countDocuments({
    customer: customerId,
    status: BOOKING_STATUS.REQUESTED,
  });

  if (
    activeRequestsCount >= BUSINESS_DEFAULTS.MAX_ACTIVE_REQUESTS_PER_CUSTOMER
  ) {
    throw new ApiError(
      400,
      `You have reached the maximum allowed active requests (${BUSINESS_DEFAULTS.MAX_ACTIVE_REQUESTS_PER_CUSTOMER})`
    );
  }

  // Overlap check on vehicle
  const activeStatuses = [
    BOOKING_STATUS.REQUESTED,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.ONGOING,
  ];

  const conflict = await Booking.findOne({
    $or: [{ vehicle: vehicle._id }, { assignedVehicle: vehicle._id }],
    status: { $in: activeStatuses },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (conflict) {
    throw new ApiError(
      409,
      "Vehicle is already reserved or held for overlapping dates"
    );
  }

  const unavailConflict = await VehicleUnavailability.findOne({
    vehicle: vehicle._id,
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (unavailConflict) {
    throw new ApiError(
      409,
      "Vehicle is unavailable during the requested dates"
    );
  }

  // Response deadline: min(now + RESPONSE_WINDOW_HOURS, startAt - 1 hour)
  const windowDeadline = new Date(
    now.getTime() + BUSINESS_DEFAULTS.RESPONSE_WINDOW_HOURS * 3600 * 1000
  );
  const leadDeadline = new Date(startAt.getTime() - 1 * 3600 * 1000);
  const responseDeadlineAt = new Date(
    Math.min(windowDeadline.getTime(), leadDeadline.getTime())
  );

  // Pricing calculation
  const perDay = vehicle.pricing?.perDay || 0;
  const perHour = vehicle.pricing?.perHour || 0;
  const deposit = vehicle.pricing?.deposit || 0;
  const fullDays = Math.floor(durationHours / 24);
  const remainingHours = durationHours % 24;
  const estimatedTotal = fullDays * perDay + remainingHours * perHour;

  const bookingCode = await generateBookingCode();

  const booking = await Booking.create({
    bookingCode,
    idempotencyKey: options.idempotencyKey || null,
    customer: customerId,
    publisher: vehicle.publisher,
    vehicle: vehicle._id,
    assignedVehicle: vehicle._id,
    startAt,
    endAt,
    durationHours,
    pricingSnapshot: {
      perDay,
      perHour,
      deposit,
      estimatedTotal,
      note: "Informational. Paid directly to the agent or owner at pickup.",
    },
    customerNote: data.customerNote || "",
    status: BOOKING_STATUS.REQUESTED,
    statusHistory: [
      {
        status: BOOKING_STATUS.REQUESTED,
        at: now,
        by: customerId,
        note: "Booking request created by customer",
      },
    ],
    responseDeadlineAt,
    pickup: {
      mode: vehicle.pickup?.mode || PICKUP_MODES.FIXED,
    },
  });

  // Increment requests received counter on publisher profile
  await PublisherProfile.findOneAndUpdate(
    { user: vehicle.publisher },
    { $inc: { "reliability.requestsReceived": 1 } }
  );

  // Send notification to publisher
  notify({
    event: NOTIFICATION_EVENTS.BOOKING_REQUESTED,
    userId: vehicle.publisher,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      customerName: customer.fullName,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle", "brand model type pricing pickup");

  return serializeBooking(populated, customer);
};

export const getMyBookings = async (customer, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { customer: customer._id };

  if (query.status) {
    filter.status = query.status;
  }

  const totalItems = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle", "brand model type pricing pickup")
    .populate("assignedVehicle", "brand model type pricing pickup")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const serialized = serializeBookings(bookings, customer);
  return formatPaginatedResponse({
    items: serialized,
    totalItems,
    page,
    limit,
  });
};

export const getReceivedBookings = async (publisher, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { publisher: publisher._id };

  if (query.status) {
    filter.status = query.status;
  }

  const totalItems = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle", "brand model type pricing pickup")
    .populate("assignedVehicle", "brand model type pricing pickup")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const serialized = serializeBookings(bookings, publisher);
  return formatPaginatedResponse({
    items: serialized,
    totalItems,
    page,
    limit,
  });
};

export const getBookingById = async (viewer, bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const viewerId = (viewer._id || viewer.id || "").toString();
  const isCustomer = viewerId === booking.customer?._id?.toString();
  const isPublisher = viewerId === booking.publisher?._id?.toString();
  const isAdmin = viewer.role === ROLES.ADMIN;

  if (!isCustomer && !isPublisher && !isAdmin) {
    throw new ApiError(403, "Access denied to this booking");
  }

  return serializeBooking(booking, viewer);
};

export const acceptBooking = async (publisher, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(
      403,
      "You can only accept bookings for your own vehicles"
    );
  }

  if (booking.status !== BOOKING_STATUS.REQUESTED) {
    throw new ApiError(
      400,
      `Cannot accept booking in '${booking.status}' status`
    );
  }

  const now = new Date();
  if (now > booking.responseDeadlineAt) {
    throw new ApiError(400, "Response window has already expired");
  }

  const hoursUntilPickup = getHoursDifference(now, booking.startAt);

  // Late acceptance rule: under 24 hours requires vehicle confirmation details
  if (hoursUntilPickup < BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_LEAD_HOURS) {
    if (!data?.chassisNumber || !data?.registrationNumber) {
      throw new ApiError(
        400,
        "Pickup is less than 24 hours away. Vehicle confirmation details (chassis and registration number) are required to accept."
      );
    }
  }

  // Setup pickup point based on publisher type
  const profile = await PublisherProfile.findOne({ user: publisher._id });
  if (profile?.publisherType === ROLES.AGENT) {
    booking.pickup.mode = PICKUP_MODES.FIXED;
    booking.pickup.address = profile.agentPickup?.address || "";
    booking.pickup.landmark = profile.agentPickup?.landmark || "";
    booking.pickup.location = profile.agentPickup?.location || {
      type: "Point",
      coordinates: [0, 0],
    };
    booking.pickup.finalizedAt = now;
  } else {
    booking.pickup.mode = PICKUP_MODES.FLEXIBLE;
    booking.pickup.note =
      "Flexible pickup point will be finalized by publisher";
  }

  // Vehicle confirmation due date
  const leadMs =
    BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_LEAD_HOURS * 3600 * 1000;
  const targetDueAt = new Date(booking.startAt.getTime() - leadMs);
  booking.vehicleConfirmation.dueAt = targetDueAt < now ? now : targetDueAt;

  // If vehicle confirmation details are provided now (or required by late acceptance)
  if (data?.chassisNumber && data?.registrationNumber) {
    booking.vehicleConfirmation.chassisNumber = data.chassisNumber
      .trim()
      .toUpperCase();
    booking.vehicleConfirmation.registrationNumber = data.registrationNumber
      .trim()
      .toUpperCase();
    booking.vehicleConfirmation.color = data.color?.trim() || "";
    booking.vehicleConfirmation.notes = data.notes?.trim() || "";
    booking.vehicleConfirmation.confirmedAt = now;
    booking.vehicleConfirmation.confirmedBy = publisher._id;
  }

  transitionBookingStatus(
    booking,
    BOOKING_STATUS.CONFIRMED,
    publisher._id,
    "Accepted by publisher"
  );
  booking.confirmedAt = now;
  booking.respondedAt = now;

  await booking.save();

  // Update publisher reliability
  const responseMinutes = Math.max(
    1,
    Math.round((now.getTime() - booking.createdAt.getTime()) / 60000)
  );

  if (profile) {
    const acceptedCount = (profile.reliability?.accepted || 0) + 1;
    const oldAvg = profile.reliability?.avgResponseMinutes || 0;
    const newAvg = Math.round(
      (oldAvg * (profile.reliability?.accepted || 0) + responseMinutes) /
        acceptedCount
    );

    await PublisherProfile.findByIdAndUpdate(profile._id, {
      $inc: { "reliability.accepted": 1 },
      $set: { "reliability.avgResponseMinutes": newAvg },
    });
  }

  // Send notification to customer
  const vehicle = await Vehicle.findById(booking.vehicle);
  notify({
    event: NOTIFICATION_EVENTS.BOOKING_CONFIRMED,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      vehicleName: vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : "your vehicle",
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const rejectBooking = async (publisher, bookingId, reason = "") => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(
      403,
      "You can only reject bookings for your own vehicles"
    );
  }

  if (booking.status !== BOOKING_STATUS.REQUESTED) {
    throw new ApiError(
      400,
      `Cannot reject booking in '${booking.status}' status`
    );
  }

  const now = new Date();
  transitionBookingStatus(
    booking,
    BOOKING_STATUS.REJECTED,
    publisher._id,
    reason || "Rejected by publisher"
  );
  booking.rejectionReason = reason || "";
  booking.respondedAt = now;

  await booking.save();

  await PublisherProfile.findOneAndUpdate(
    { user: publisher._id },
    { $inc: { "reliability.rejected": 1 } }
  );

  const vehicle = await Vehicle.findById(booking.vehicle);
  notify({
    event: NOTIFICATION_EVENTS.BOOKING_REJECTED,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      vehicleName: vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : "your vehicle",
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle");

  return serializeBooking(populated, publisher);
};

export const cancelBooking = async (user, bookingId, reason = "") => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const userId = user._id.toString();
  const isCustomer = userId === booking.customer.toString();
  const isPublisher = userId === booking.publisher.toString();

  if (!isCustomer && !isPublisher) {
    throw new ApiError(403, "Access denied");
  }

  const now = new Date();
  if (now >= booking.startAt) {
    throw new ApiError(
      400,
      "Cannot cancel booking after scheduled pickup time"
    );
  }

  if (
    booking.status !== BOOKING_STATUS.REQUESTED &&
    booking.status !== BOOKING_STATUS.CONFIRMED
  ) {
    throw new ApiError(
      400,
      `Cannot cancel booking in '${booking.status}' status`
    );
  }

  const vehicle = await Vehicle.findById(booking.vehicle);

  if (isCustomer) {
    const hoursBefore = getHoursDifference(now, booking.startAt);
    const freeWindowHours =
      vehicle?.cancellationPolicy?.freeCancellationHours ?? 24;
    const withinFreeWindow = hoursBefore >= freeWindowHours;

    transitionBookingStatus(
      booking,
      BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
      user._id,
      reason || "Cancelled by customer"
    );

    booking.cancellation = {
      by: user._id,
      at: now,
      reason: reason || "",
      withinFreeWindow,
    };

    await booking.save();

    await User.findByIdAndUpdate(user._id, {
      $inc: { "reliability.cancellations": 1 },
    });

    notificationService.sendNotification({
      event: NOTIFICATION_EVENTS.BOOKING_CANCELLED,
      userId: booking.publisher,
      data: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        cancelledBy: "Customer",
      },
    });
  } else {
    // Publisher cancelling
    const wasConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;

    transitionBookingStatus(
      booking,
      BOOKING_STATUS.CANCELLED_BY_PUBLISHER,
      user._id,
      reason || "Cancelled by publisher"
    );

    booking.cancellation = {
      by: user._id,
      at: now,
      reason: reason || "",
      withinFreeWindow: false,
    };

    await booking.save();

    if (wasConfirmed) {
      await PublisherProfile.findOneAndUpdate(
        { user: user._id },
        { $inc: { "reliability.cancelledAfterConfirm": 1 } }
      );
    }

    notificationService.sendNotification({
      event: NOTIFICATION_EVENTS.BOOKING_CANCELLED,
      userId: booking.customer,
      data: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        cancelledBy: "Publisher",
      },
    });
  }

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, user);
};

export const finalizePickupPoint = async (publisher, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (
    booking.status !== BOOKING_STATUS.CONFIRMED &&
    booking.status !== BOOKING_STATUS.ONGOING
  ) {
    throw new ApiError(
      400,
      `Cannot set pickup point for booking in '${booking.status}' status`
    );
  }

  booking.pickup.address = data.address;
  booking.pickup.landmark = data.landmark || "";
  booking.pickup.location = {
    type: "Point",
    coordinates: data.coordinates,
  };
  booking.pickup.finalizedAt = new Date();
  if (data.note) {
    booking.pickup.note = data.note;
  }

  await booking.save();

  await logAudit({
    actorId: adminUser._id,
    action: "override_booking_status",
    targetType: "Booking",
    targetId: booking._id,
    after: { status: targetStatus, note },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const confirmVehicle = async (publisher, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Vehicle can only be confirmed for 'confirmed' bookings (current status: '${booking.status}')`
    );
  }

  const now = new Date();

  // Handle vehicle swap
  if (
    data.assignedVehicleId &&
    String(data.assignedVehicleId) !== String(booking.vehicle)
  ) {
    const swapVehicle = await Vehicle.findById(data.assignedVehicleId).select(
      "+chassisNumber +registrationNumber"
    );
    if (!swapVehicle) {
      throw new ApiError(404, "Swapped vehicle not found");
    }

    if (String(swapVehicle.publisher) !== String(publisher._id)) {
      throw new ApiError(403, "Swapped vehicle must belong to you");
    }

    if (swapVehicle.status !== VEHICLE_STATUS.ACTIVE) {
      throw new ApiError(400, "Swapped vehicle is not active");
    }

    const originalVehicle = await Vehicle.findById(booking.vehicle);
    if (swapVehicle.type !== originalVehicle.type) {
      throw new ApiError(
        400,
        `Swapped vehicle must be of same type (${originalVehicle.type})`
      );
    }

    // Check availability of swapped vehicle
    const activeStatuses = [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.ONGOING,
    ];

    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      $or: [{ vehicle: swapVehicle._id }, { assignedVehicle: swapVehicle._id }],
      status: { $in: activeStatuses },
      startAt: { $lt: booking.endAt },
      endAt: { $gt: booking.startAt },
    });

    if (conflict) {
      throw new ApiError(
        409,
        "Swapped vehicle is not available for this booking window"
      );
    }

    booking.assignedVehicle = swapVehicle._id;
    booking.vehicleConfirmation.swappedFromVehicle = booking.vehicle;
  }

  booking.vehicleConfirmation.chassisNumber = data.chassisNumber
    .trim()
    .toUpperCase();
  booking.vehicleConfirmation.registrationNumber = data.registrationNumber
    .trim()
    .toUpperCase();
  booking.vehicleConfirmation.color = data.color?.trim() || "";
  booking.vehicleConfirmation.notes = data.notes?.trim() || "";
  booking.vehicleConfirmation.confirmedAt = now;
  booking.vehicleConfirmation.confirmedBy = publisher._id;

  await booking.save();

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMED,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const reportVehicleUnavailable = async (publisher, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Can only report unavailability for confirmed bookings (current status: '${booking.status}')`
    );
  }

  const now = new Date();
  const hoursBeforePickup = getHoursDifference(now, booking.startAt);
  const lateDisclosure =
    hoursBeforePickup < BUSINESS_DEFAULTS.LATE_DISCLOSURE_HOURS;

  transitionBookingStatus(
    booking,
    BOOKING_STATUS.VEHICLE_UNAVAILABLE,
    publisher._id,
    `Unavailable: ${data.reason}. ${data.note || ""}`
  );

  booking.unavailability = {
    reportedAt: now,
    reason: data.reason,
    note: data.note || "",
    hoursBeforePickup,
    lateDisclosure,
  };

  await booking.save();

  // Create VehicleUnavailability block if damaged, maintenance, or in_service
  if (
    [
      UNAVAILABILITY_REASONS.DAMAGED,
      UNAVAILABILITY_REASONS.MAINTENANCE,
      UNAVAILABILITY_REASONS.IN_SERVICE,
    ].includes(data.reason)
  ) {
    await VehicleUnavailability.create({
      vehicle: booking.assignedVehicle || booking.vehicle,
      startAt: booking.startAt,
      endAt: booking.endAt,
      reason: data.reason,
      notes: `Reported unavailable on booking ${booking.bookingCode}`,
      createdBy: publisher._id,
    });
  }

  if (lateDisclosure) {
    await PublisherProfile.findOneAndUpdate(
      { user: publisher._id },
      { $inc: { "reliability.lateDisclosures": 1 } }
    );
  }

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_VEHICLE_UNAVAILABLE,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const confirmPickupReady = async (publisher, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Can only confirm pickup ready for confirmed bookings`
    );
  }

  booking.prePickupConfirmedAt = new Date();
  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const recordHandover = async (publisher, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Handover can only be recorded for confirmed bookings (current status: '${booking.status}')`
    );
  }

  if (!data.customerIdVerified || !data.licenseVerified) {
    throw new ApiError(
      400,
      "Both customer ID and driving license must be verified"
    );
  }

  const now = new Date();
  transitionBookingStatus(
    booking,
    BOOKING_STATUS.ONGOING,
    publisher._id,
    "Handover completed"
  );

  booking.handover = {
    customerIdVerified: true,
    licenseVerified: true,
    verifiedAt: now,
    pickedUpAt: now,
    markedBy: publisher._id,
    declined: {
      at: null,
      reason: "",
      note: "",
    },
  };

  await booking.save();

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_PICKED_UP,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const declineHandover = async (publisher, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Handover decline is only allowed for confirmed bookings`
    );
  }

  const now = new Date();
  transitionBookingStatus(
    booking,
    BOOKING_STATUS.HANDOVER_DECLINED,
    publisher._id,
    `Handover declined: ${data.reason}. ${data.note || ""}`
  );

  booking.handover.declined = {
    at: now,
    reason: data.reason,
    note: data.note || "",
  };

  await booking.save();

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_HANDOVER_DECLINED,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      reason: data.reason,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const customerMarkPickedUp = async (customer, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.customer) !== String(customer._id)) {
    throw new ApiError(403, "Access denied");
  }

  const now = new Date();
  booking.customerPickedUpAt = now;

  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    transitionBookingStatus(
      booking,
      BOOKING_STATUS.ONGOING,
      customer._id,
      "Customer confirmed vehicle pickup"
    );
  }

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, customer);
};

export const markNoShow = async (publisher, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Can only mark no-show for confirmed bookings (current status: '${booking.status}')`
    );
  }

  const now = new Date();
  const graceEnd = new Date(
    booking.startAt.getTime() +
      BUSINESS_DEFAULTS.NO_SHOW_GRACE_MINUTES * 60 * 1000
  );

  if (now < graceEnd) {
    throw new ApiError(
      400,
      `Cannot mark no-show before pickup time plus ${BUSINESS_DEFAULTS.NO_SHOW_GRACE_MINUTES} minutes grace period`
    );
  }

  transitionBookingStatus(
    booking,
    BOOKING_STATUS.NO_SHOW,
    publisher._id,
    "Marked as no-show by publisher"
  );

  await booking.save();

  // Increment customer's noShows counter
  await User.findByIdAndUpdate(booking.customer, {
    $inc: { "reliability.noShows": 1 },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const completeBooking = async (user, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const userId = user._id.toString();
  const isCustomer = userId === booking.customer.toString();
  const isPublisher = userId === booking.publisher.toString();

  if (!isCustomer && !isPublisher) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.ONGOING) {
    throw new ApiError(
      400,
      `Cannot complete booking in '${booking.status}' status. Only 'ongoing' bookings can be completed.`
    );
  }

  const now = new Date();
  transitionBookingStatus(
    booking,
    BOOKING_STATUS.COMPLETED,
    user._id,
    `Completed by ${isCustomer ? "customer" : "publisher"}`
  );

  booking.completion = {
    completedAt: now,
    completedBy: isCustomer ? "customer" : "publisher",
    autoCompleted: false,
  };

  await booking.save();

  // Increment tripsCompleted on the vehicle
  await Vehicle.findByIdAndUpdate(booking.assignedVehicle || booking.vehicle, {
    $inc: { tripsCompleted: 1 },
  });

  // Increment completed on publisher profile
  await PublisherProfile.findOneAndUpdate(
    { user: booking.publisher },
    { $inc: { "reliability.completed": 1 } }
  );

  // Increment completedBookings on customer
  await User.findByIdAndUpdate(booking.customer, {
    $inc: { "reliability.completedBookings": 1 },
  });

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_COMPLETED,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    },
  });

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_COMPLETED,
    userId: booking.publisher,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, user);
};

export const requestModification = async (customer, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.customer) !== String(customer._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Date modification can only be requested for confirmed bookings before pickup`
    );
  }

  const now = new Date();
  if (now >= booking.startAt) {
    throw new ApiError(
      400,
      "Cannot request modification after scheduled pickup time"
    );
  }

  const newStartAt = new Date(data.newStartAt);
  const newEndAt = new Date(data.newEndAt);

  booking.modificationRequests.push({
    requestedBy: customer._id,
    newStartAt,
    newEndAt,
    status: "pending",
    decidedAt: null,
    createdAt: now,
  });

  await booking.save();

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_MODIFICATION_REQUESTED,
    userId: booking.publisher,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, customer);
};

export const decideModification = async (
  publisher,
  bookingId,
  reqId,
  action
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (String(booking.publisher) !== String(publisher._id)) {
    throw new ApiError(403, "Access denied");
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(
      400,
      `Modification decision can only be made on confirmed bookings`
    );
  }

  const modReq = booking.modificationRequests.id(reqId);
  if (!modReq) {
    throw new ApiError(404, "Modification request not found");
  }

  if (modReq.status !== "pending") {
    throw new ApiError(400, "Modification request has already been decided");
  }

  const now = new Date();

  if (action === "accept") {
    // Re-check vehicle availability for new window
    const activeStatuses = [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.ONGOING,
    ];

    const targetVehicle = booking.assignedVehicle || booking.vehicle;

    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      $or: [{ vehicle: targetVehicle }, { assignedVehicle: targetVehicle }],
      status: { $in: activeStatuses },
      startAt: { $lt: modReq.newEndAt },
      endAt: { $gt: modReq.newStartAt },
    });

    if (conflict) {
      throw new ApiError(
        409,
        "Vehicle is not available for the requested modification dates"
      );
    }

    const unavail = await VehicleUnavailability.findOne({
      vehicle: targetVehicle,
      startAt: { $lt: modReq.newEndAt },
      endAt: { $gt: modReq.newStartAt },
    });

    if (unavail) {
      throw new ApiError(
        409,
        "Vehicle has scheduled unavailability during the requested modification dates"
      );
    }

    // Apply new dates
    booking.startAt = modReq.newStartAt;
    booking.endAt = modReq.newEndAt;
    booking.durationHours = Math.ceil(
      getHoursDifference(modReq.newStartAt, modReq.newEndAt)
    );

    // Recompute pricing
    const vehicle = await Vehicle.findById(booking.vehicle);
    if (vehicle) {
      const fullDays = Math.floor(booking.durationHours / 24);
      const remainingHours = booking.durationHours % 24;
      booking.pricingSnapshot.estimatedTotal =
        fullDays * (vehicle.pricing?.perDay || 0) +
        remainingHours * (vehicle.pricing?.perHour || 0);
    }

    // Update vehicle confirmation deadline
    const leadMs =
      BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_LEAD_HOURS * 3600 * 1000;
    const targetDueAt = new Date(booking.startAt.getTime() - leadMs);
    booking.vehicleConfirmation.dueAt = targetDueAt < now ? now : targetDueAt;

    modReq.status = "accepted";
    modReq.decidedAt = now;
  } else {
    modReq.status = "rejected";
    modReq.decidedAt = now;
  }

  await booking.save();

  notify({
    event: NOTIFICATION_EVENTS.BOOKING_MODIFICATION_DECIDED,
    userId: booking.customer,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      action,
    },
  });

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return serializeBooking(populated, publisher);
};

export const getBackupVehicles = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate("vehicle");
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const baseVehicle = booking.vehicle;
  const startAt = booking.startAt;
  const endAt = booking.endAt;

  const candidateVehicles = await Vehicle.find({
    _id: { $ne: baseVehicle._id },
    destination: baseVehicle.destination,
    type: baseVehicle.type,
    status: VEHICLE_STATUS.ACTIVE,
  })
    .populate("publisher", "fullName")
    .populate("publisherProfile", "reliability")
    .limit(20);

  const availableBackups = [];

  for (const candidate of candidateVehicles) {
    const activeStatuses = [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.ONGOING,
    ];

    const hasBookingConflict = await Booking.exists({
      $or: [{ vehicle: candidate._id }, { assignedVehicle: candidate._id }],
      status: { $in: activeStatuses },
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });

    if (hasBookingConflict) continue;

    const hasUnavailConflict = await VehicleUnavailability.exists({
      vehicle: candidate._id,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });

    if (hasUnavailConflict) continue;

    availableBackups.push(candidate);
  }

  const targetPrice =
    booking.pricingSnapshot?.perDay || baseVehicle.pricing?.perDay || 0;

  // Rank by price closeness, then ratings avg, then publisher reliability score
  availableBackups.sort((a, b) => {
    const diffA = Math.abs((a.pricing?.perDay || 0) - targetPrice);
    const diffB = Math.abs((b.pricing?.perDay || 0) - targetPrice);
    if (diffA !== diffB) return diffA - diffB;

    const ratingA = a.ratings?.avg || 0;
    const ratingB = b.ratings?.avg || 0;
    if (ratingA !== ratingB) return ratingB - ratingA;

    const relA = a.publisherProfile?.reliability?.score || 100;
    const relB = b.publisherProfile?.reliability?.score || 100;
    return relB - relA;
  });

  return availableBackups.slice(0, 3);
};

export const getAdminBookings = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.publisherId) {
    filter.publisher = query.publisherId;
  }

  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from) filter.startAt.$gte = new Date(query.from);
    if (query.to) filter.startAt.$lte = new Date(query.to);
  }

  if (query.destinationId) {
    const destinationVehicleIds = await Vehicle.find({
      destination: query.destinationId,
    }).distinct("_id");
    filter.vehicle = { $in: destinationVehicleIds };
  }

  const totalItems = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({
    items: bookings,
    totalItems,
    page,
    limit,
  });
};

export const adminOverrideStatus = async (
  adminUser,
  bookingId,
  targetStatus,
  note
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  booking.statusHistory.push({
    status: targetStatus,
    at: new Date(),
    by: adminUser._id,
    note: `[Admin Override]: ${note}`,
  });

  booking.status = targetStatus;

  if (
    targetStatus === BOOKING_STATUS.COMPLETED &&
    !booking.completion?.completedAt
  ) {
    booking.completion = {
      completedAt: new Date(),
      completedBy: "system",
      autoCompleted: false,
    };
  }

  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate("customer", "fullName phone reliability email")
    .populate("publisher", "fullName phone email")
    .populate("vehicle")
    .populate("assignedVehicle");

  return populated;
};
