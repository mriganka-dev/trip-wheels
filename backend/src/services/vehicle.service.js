import mongoose from "mongoose";
import { env } from "../config/env.js";
import {
  BOOKING_STATUS,
  BUSINESS_DEFAULTS,
  NOTIFICATION_EVENTS,
  PICKUP_MODES,
  ROLES,
  TERMINAL_BOOKING_STATUSES,
  VEHICLE_STATUS,
} from "../constants.js";
import { Destination } from "../models/destination.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { VehicleUnavailability } from "../models/vehicleUnavailability.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
  uploadPrivateOnCloudinary,
} from "../utils/cloudinary.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";
import { notify } from "./notification.service.js";

const PRIVATE_VEHICLE_FIELDS =
  "-chassisNumber -registrationNumber -rc -insurance -noc";

const stripPrivateFromPublic = (vehicleObj) => {
  delete vehicleObj.chassisNumber;
  delete vehicleObj.registrationNumber;
  delete vehicleObj.rc;
  delete vehicleObj.insurance;
  delete vehicleObj.noc;
  return vehicleObj;
};

const stripIndividualPickupDetails = (vehicleObj) => {
  if (vehicleObj.pickup?.mode === PICKUP_MODES.FLEXIBLE) {
    vehicleObj.pickup = {
      mode: PICKUP_MODES.FLEXIBLE,
      approximateArea: vehicleObj.pickup.approximateArea || "",
    };
  }
  return vehicleObj;
};

const computeEstimatedTotal = (pricing, durationHours) => {
  const days = Math.ceil(durationHours / 24);
  const totalByDay = days * pricing.perDay;

  if (pricing.perHour && durationHours < 24) {
    const totalByHour = durationHours * pricing.perHour;
    if (totalByHour < totalByDay) {
      return {
        amount: totalByHour,
        basis: "hourly",
        hours: durationHours,
        note: "Informational. Paid directly to the agent or owner at pickup.",
      };
    }
  }

  return {
    amount: totalByDay,
    basis: "daily",
    days,
    note: "Informational. Paid directly to the agent or owner at pickup.",
  };
};

const hasBookingConflict = async (vehicleId, from, to) => {
  if (!mongoose.models.Booking) {
    return false;
  }

  const activeStatuses = [
    BOOKING_STATUS.REQUESTED,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.ONGOING,
  ];

  const conflict = await mongoose.models.Booking.findOne({
    $or: [{ vehicle: vehicleId }, { assignedVehicle: vehicleId }],
    status: { $in: activeStatuses },
    startAt: { $lt: to },
    endAt: { $gt: from },
  });

  return !!conflict;
};

const hasUnavailabilityConflict = async (vehicleId, from, to) => {
  const conflict = await VehicleUnavailability.findOne({
    vehicle: vehicleId,
    from: { $lt: to },
    to: { $gt: from },
  });

  return !!conflict;
};

export const createVehicle = async (user, publisherProfile, data) => {
  if (user.role === ROLES.INDIVIDUAL) {
    const count = await Vehicle.countDocuments({
      publisher: user._id,
      isDeleted: false,
    });

    if (count >= BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES) {
      const profile = await PublisherProfile.findById(publisherProfile._id);
      if (profile) {
        profile.flags.push({
          type: "individual_vehicle_cap_reached",
          note: `Individual attempted to add more than ${BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES} vehicles`,
        });
        await profile.save();
      }

      throw new ApiError(
        400,
        `Individual publishers can list at most ${BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES} vehicles. Register as an agent to list more.`
      );
    }
  }

  const destination = await Destination.findById(data.destination);
  if (!destination || !destination.isActive) {
    throw new ApiError(400, "Invalid or inactive destination");
  }

  let pickup;
  if (user.role === ROLES.AGENT) {
    pickup = {
      mode: PICKUP_MODES.FIXED,
      address: publisherProfile.agentPickup?.address || "",
      landmark: publisherProfile.agentPickup?.landmark || "",
      location: publisherProfile.agentPickup?.location || undefined,
    };
  } else {
    pickup = {
      mode: PICKUP_MODES.FLEXIBLE,
      approximateArea: publisherProfile.individualArea?.area
        ? `${publisherProfile.individualArea.area}, ${publisherProfile.individualArea.city}`
        : "",
    };
  }

  const vehicle = await Vehicle.create({
    publisher: user._id,
    publisherProfile: publisherProfile._id,
    destination: destination._id,
    type: data.type,
    brand: data.brand,
    model: data.model,
    variant: data.variant || "",
    year: data.year,
    color: data.color || "",
    transmission: data.transmission,
    fuelType: data.fuelType,
    seats: data.seats || null,
    engineCc: data.engineCc || null,
    mileage: data.mileage || "",
    pricing: {
      perDay: data.pricing.perDay,
      perHour: data.pricing.perHour || null,
      deposit: data.pricing.deposit || 0,
      currency: "INR",
    },
    minRentalHours: data.minRentalHours || 4,
    cancellationPolicy: data.cancellationPolicy || {
      freeCancellationHoursBeforePickup: 24,
    },
    pickup,
    status: VEHICLE_STATUS.DRAFT,
  });

  return vehicle;
};

export const updateVehicle = async (vehicleId, userId, data) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  const keyFields = [
    "type",
    "brand",
    "model",
    "year",
    "transmission",
    "fuelType",
  ];
  let needsReReview = false;

  for (const field of keyFields) {
    if (data[field] !== undefined && data[field] !== vehicle[field]) {
      needsReReview = true;
      break;
    }
  }

  if (data.type !== undefined) vehicle.type = data.type;
  if (data.brand !== undefined) vehicle.brand = data.brand;
  if (data.model !== undefined) vehicle.model = data.model;
  if (data.variant !== undefined) vehicle.variant = data.variant;
  if (data.year !== undefined) vehicle.year = data.year;
  if (data.color !== undefined) vehicle.color = data.color;
  if (data.transmission !== undefined) vehicle.transmission = data.transmission;
  if (data.fuelType !== undefined) vehicle.fuelType = data.fuelType;
  if (data.seats !== undefined) vehicle.seats = data.seats;
  if (data.engineCc !== undefined) vehicle.engineCc = data.engineCc;
  if (data.mileage !== undefined) vehicle.mileage = data.mileage;
  if (data.minRentalHours !== undefined)
    vehicle.minRentalHours = data.minRentalHours;

  if (data.pricing) {
    if (data.pricing.perDay !== undefined)
      vehicle.pricing.perDay = data.pricing.perDay;
    if (data.pricing.perHour !== undefined)
      vehicle.pricing.perHour = data.pricing.perHour;
    if (data.pricing.deposit !== undefined)
      vehicle.pricing.deposit = data.pricing.deposit;
  }

  if (data.cancellationPolicy) {
    Object.assign(vehicle.cancellationPolicy, data.cancellationPolicy);
  }

  if (needsReReview && vehicle.status === VEHICLE_STATUS.ACTIVE) {
    vehicle.status = VEHICLE_STATUS.PENDING_REVIEW;
  }

  await vehicle.save();
  return vehicle;
};

export const uploadVehicleImages = async (vehicleId, userId, files) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (vehicle.images.length + files.length > 10) {
    throw new ApiError(400, "A vehicle can have at most 10 images");
  }

  const uploadPromises = files.map((file) =>
    uploadOnCloudinary(file.path, "trip_wheels/vehicles")
  );
  const results = await Promise.all(uploadPromises);

  for (const result of results) {
    if (result) {
      vehicle.images.push({ url: result.url, publicId: result.publicId });
    }
  }

  await vehicle.save();
  return vehicle;
};

export const deleteVehicleImage = async (vehicleId, imageId, userId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  const image = vehicle.images.id(imageId);
  if (!image) {
    throw new ApiError(404, "Image not found");
  }

  if (image.publicId) {
    try {
      await deleteFromCloudinary(image.publicId);
    } catch (err) {
      console.error(
        "Failed to delete vehicle image from Cloudinary:",
        err.message
      );
    }
  }

  vehicle.images.pull(imageId);
  await vehicle.save();
  return vehicle;
};

export const uploadVehicleDocuments = async (
  vehicleId,
  userId,
  fields,
  body
) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  }).select("+chassisNumber +registrationNumber");

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  vehicle.chassisNumber = body.chassisNumber;

  const normalizedReg = body.registrationNumber
    .toUpperCase()
    .replace(/[\s-]/g, "");

  const dupReg = await Vehicle.findOne({
    registrationNumber: normalizedReg,
    _id: { $ne: vehicleId },
  }).select("+registrationNumber");

  if (dupReg) {
    throw new ApiError(
      409,
      "A vehicle with this registration number is already listed on the platform"
    );
  }

  vehicle.registrationNumber = normalizedReg;

  vehicle.rc.ownerName = body.rcOwnerName;
  vehicle.rc.registrationNumber = normalizedReg;
  vehicle.insurance.policyNumber = body.insurancePolicyNumber;
  vehicle.insurance.expiresAt = body.insuranceExpiresAt;

  if (fields.rc && fields.rc[0]) {
    const rcResult = await uploadPrivateOnCloudinary(
      fields.rc[0].path,
      "trip_wheels/vehicle_docs"
    );
    if (rcResult) {
      vehicle.rc.file = { url: rcResult.url, publicId: rcResult.publicId };
    }
  }

  if (fields.insurance && fields.insurance[0]) {
    const insResult = await uploadPrivateOnCloudinary(
      fields.insurance[0].path,
      "trip_wheels/vehicle_docs"
    );
    if (insResult) {
      vehicle.insurance.file = {
        url: insResult.url,
        publicId: insResult.publicId,
      };
    }
  }

  if (fields.noc && fields.noc[0]) {
    const nocResult = await uploadPrivateOnCloudinary(
      fields.noc[0].path,
      "trip_wheels/vehicle_docs"
    );
    if (nocResult) {
      vehicle.noc = {
        file: { url: nocResult.url, publicId: nocResult.publicId },
      };
    }
  }

  const publisherUser = await mongoose.model("User").findById(userId);
  if (publisherUser) {
    const publisherTokens = publisherUser.fullName
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const rcTokens = body.rcOwnerName
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const matchCount = publisherTokens.filter((t) =>
      rcTokens.includes(t)
    ).length;
    const nameMatches =
      matchCount >= Math.min(publisherTokens.length, rcTokens.length);

    if (!nameMatches) {
      const profile = await PublisherProfile.findOne({ user: userId });
      if (profile) {
        const hasFlag = profile.flags.some(
          (f) =>
            f.type === "rc_name_mismatch" &&
            !f.resolved &&
            f.note.includes(normalizedReg)
        );
        if (!hasFlag) {
          profile.flags.push({
            type: "rc_name_mismatch",
            note: `RC owner "${body.rcOwnerName}" does not match publisher "${publisherUser.fullName}" for vehicle ${normalizedReg}`,
          });
          await profile.save();
        }
      }
    }
  }

  await vehicle.save();
  return vehicle;
};

export const submitVehicle = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  }).select("+chassisNumber +registrationNumber");

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  const missing = [];
  if (vehicle.images.length < 3) {
    missing.push("At least 3 images are required");
  }
  if (!vehicle.rc?.file?.publicId) {
    missing.push("RC document is required");
  }
  if (!vehicle.insurance?.file?.publicId) {
    missing.push("Insurance document is required");
  }
  if (
    vehicle.insurance?.expiresAt &&
    vehicle.insurance.expiresAt < new Date()
  ) {
    missing.push("Insurance has expired");
  }
  if (!vehicle.chassisNumber) {
    missing.push("Chassis number is required");
  }
  if (!vehicle.registrationNumber) {
    missing.push("Registration number is required");
  }
  if (!vehicle.pricing?.perDay) {
    missing.push("Per-day pricing is required");
  }
  if (!vehicle.destination) {
    missing.push("Destination is required");
  }

  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Vehicle cannot be submitted: ${missing.join("; ")}`
    );
  }

  vehicle.status = VEHICLE_STATUS.PENDING_REVIEW;
  await vehicle.save();
  return vehicle;
};

export const pauseVehicle = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
    status: VEHICLE_STATUS.ACTIVE,
  });

  if (!vehicle) {
    throw new ApiError(404, "Active vehicle not found");
  }

  vehicle.status = VEHICLE_STATUS.PAUSED;
  await vehicle.save();
  return vehicle;
};

export const resumeVehicle = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
    status: VEHICLE_STATUS.PAUSED,
  });

  if (!vehicle) {
    throw new ApiError(404, "Paused vehicle not found");
  }

  vehicle.status = VEHICLE_STATUS.ACTIVE;
  await vehicle.save();
  return vehicle;
};

export const softDeleteVehicle = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (mongoose.models.Booking) {
    const activeBooking = await mongoose.models.Booking.findOne({
      vehicle: vehicleId,
      status: {
        $nin: TERMINAL_BOOKING_STATUSES,
      },
    });

    if (activeBooking) {
      throw new ApiError(400, "Cannot delete a vehicle with active bookings");
    }
  }

  vehicle.isDeleted = true;
  await vehicle.save();
  return true;
};

export const getMyVehicles = async (userId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { publisher: userId, isDeleted: false };

  if (query.status) {
    filter.status = query.status;
  }

  const [items, totalItems] = await Promise.all([
    Vehicle.find(filter)
      .populate("destination", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Vehicle.countDocuments(filter),
  ]);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const addUnavailability = async (vehicleId, userId, data) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  if (new Date(data.from) >= new Date(data.to)) {
    throw new ApiError(400, "Start date must be before end date");
  }

  const block = await VehicleUnavailability.create({
    vehicle: vehicleId,
    from: data.from,
    to: data.to,
    reason: data.reason,
    createdBy: userId,
  });

  return block;
};

export const getUnavailability = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  return await VehicleUnavailability.find({ vehicle: vehicleId }).sort({
    from: 1,
  });
};

export const removeUnavailability = async (vehicleId, blockId, userId) => {
  const block = await VehicleUnavailability.findOne({
    _id: blockId,
    vehicle: vehicleId,
  });

  if (!block) {
    throw new ApiError(404, "Unavailability block not found");
  }

  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    publisher: userId,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(403, "You do not own this vehicle");
  }

  await VehicleUnavailability.findByIdAndDelete(blockId);
  return true;
};

// --- Admin ---

export const getAdminVehicles = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { isDeleted: false };

  if (query.status) {
    filter.status = query.status;
  }

  const [items, totalItems] = await Promise.all([
    Vehicle.find(filter)
      .populate("publisher", "fullName email phone")
      .populate("destination", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Vehicle.countDocuments(filter),
  ]);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const adminApproveVehicle = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  vehicle.status = VEHICLE_STATUS.ACTIVE;
  vehicle.rejectionReason = "";
  await vehicle.save();

  await notify(NOTIFICATION_EVENTS.VEHICLE_APPROVED, {
    userId: vehicle.publisher,
    vehicleId: vehicle._id,
  });

  return vehicle;
};

export const adminRejectVehicle = async (vehicleId, reason) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  vehicle.status = VEHICLE_STATUS.REJECTED;
  vehicle.rejectionReason = reason;
  await vehicle.save();

  await notify(NOTIFICATION_EVENTS.VEHICLE_REJECTED, {
    userId: vehicle.publisher,
    vehicleId: vehicle._id,
    reason,
  });

  return vehicle;
};

export const adminSuspendVehicle = async (vehicleId, reason) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  vehicle.status = VEHICLE_STATUS.SUSPENDED;
  vehicle.rejectionReason = reason || "Suspended by admin";
  await vehicle.save();

  return vehicle;
};

// --- Search and Public ---

export const searchVehicles = async (searchParams) => {
  const { page, limit, skip } = getPagination(searchParams);

  const destination = await (async () => {
    if (searchParams.destination.match(/^[0-9a-fA-F]{24}$/)) {
      return Destination.findById(searchParams.destination);
    }
    return Destination.findOne({
      slug: searchParams.destination.toLowerCase(),
    });
  })();

  if (!destination) {
    throw new ApiError(404, "Destination not found");
  }

  const from = new Date(searchParams.from);
  const to = new Date(searchParams.to);

  if (from >= to) {
    throw new ApiError(400, "End date must be after start date");
  }

  const filter = {
    destination: destination._id,
    status: VEHICLE_STATUS.ACTIVE,
    isDeleted: false,
  };

  if (searchParams.type) {
    filter.type = searchParams.type;
  }

  if (searchParams.transmission) {
    filter.transmission = searchParams.transmission;
  }

  if (searchParams.fuelType) {
    filter.fuelType = searchParams.fuelType;
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    filter["pricing.perDay"] = {};
    if (searchParams.minPrice) {
      filter["pricing.perDay"].$gte = searchParams.minPrice;
    }
    if (searchParams.maxPrice) {
      filter["pricing.perDay"].$lte = searchParams.maxPrice;
    }
  }

  filter["insurance.expiresAt"] = { $gte: to };

  const publisherFilter = {
    verificationStatus: "approved",
  };
  if (searchParams.ownerType) {
    publisherFilter.publisherType = searchParams.ownerType;
  }

  const approvedProfiles =
    await PublisherProfile.find(publisherFilter).select("user");

  const approvedUserIds = approvedProfiles.map((p) => p.user);

  const activeUsers = await mongoose
    .model("User")
    .find({
      _id: { $in: approvedUserIds },
      accountStatus: "active",
    })
    .select("_id");

  filter.publisher = { $in: activeUsers.map((u) => u._id) };

  let sort = {};
  switch (searchParams.sort) {
    case "price_asc":
      sort = { "pricing.perDay": 1 };
      break;
    case "price_desc":
      sort = { "pricing.perDay": -1 };
      break;
    case "rating":
      sort = { ratingAvg: -1, ratingCount: -1 };
      break;
    default:
      sort = { "pricing.perDay": 1 };
  }

  if (searchParams.nearLandmark) {
    const landmark = destination.landmarks.id(searchParams.nearLandmark);
    if (landmark && landmark.location?.coordinates) {
      const maxDist = (searchParams.maxDistanceKm || 50) * 1000;
      filter["pickup.location"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: landmark.location.coordinates,
          },
          $maxDistance: maxDist,
        },
      };
      if (searchParams.sort === "distance") {
        sort = {};
      }
    }
  }

  const allCandidates = await Vehicle.find(filter)
    .populate("destination", "name slug")
    .populate("publisher", "fullName")
    .populate(
      "publisherProfile",
      "publisherType reliability.score agentPickup.address agentPickup.landmark individualArea.city individualArea.area"
    )
    .sort(sort)
    .select(PRIVATE_VEHICLE_FIELDS);

  const available = [];
  for (const v of allCandidates) {
    const unavailable = await hasUnavailabilityConflict(v._id, from, to);
    if (unavailable) continue;

    const booked = await hasBookingConflict(v._id, from, to);
    if (booked) continue;

    available.push(v);
  }

  if (searchParams.sort === "reliability") {
    available.sort((a, b) => {
      const scoreA = a.publisherProfile?.reliability?.score ?? 100;
      const scoreB = b.publisherProfile?.reliability?.score ?? 100;
      return scoreB - scoreA;
    });
  }

  const totalItems = available.length;
  const paged = available.slice(skip, skip + limit);

  const durationHours = (to - from) / (1000 * 60 * 60);

  const items = paged.map((v) => {
    const obj = v.toObject();
    stripIndividualPickupDetails(obj);
    stripPrivateFromPublic(obj);

    if (obj.publisher) {
      delete obj.publisher.email;
      delete obj.publisher.phone;
    }

    obj.estimatedTotal = computeEstimatedTotal(obj.pricing, durationHours);
    return obj;
  });

  const result = formatPaginatedResponse({ items, totalItems, page, limit });

  if (items.length === 0) {
    result.suggestions = {};

    if (destination.nearbyDestinations?.length > 0) {
      const nearby = await Destination.find({
        _id: { $in: destination.nearbyDestinations },
        isActive: true,
      }).select("name slug");
      result.suggestions.nearbyDestinations = nearby;
    }

    const baseUrl = env.JOYTRIPS_BASE_URL || "";
    if (baseUrl) {
      result.suggestions.joytrips = {
        url: `${baseUrl}?destination=${encodeURIComponent(destination.name)}`,
      };
    }
  }

  return result;
};

export const getPublicVehicle = async (vehicleId) => {
  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    status: VEHICLE_STATUS.ACTIVE,
    isDeleted: false,
  })
    .populate("destination", "name slug state")
    .populate("publisher", "fullName")
    .populate(
      "publisherProfile",
      "publisherType reliability.score agentPickup.address agentPickup.landmark individualArea.city individualArea.area"
    )
    .select(PRIVATE_VEHICLE_FIELDS);

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  const obj = vehicle.toObject();
  stripIndividualPickupDetails(obj);

  if (obj.publisher) {
    delete obj.publisher.email;
    delete obj.publisher.phone;
  }

  return obj;
};

export const checkAvailability = async (vehicleId, from, to) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (fromDate >= toDate) {
    throw new ApiError(400, "End date must be after start date");
  }

  const vehicle = await Vehicle.findOne({
    _id: vehicleId,
    status: VEHICLE_STATUS.ACTIVE,
    isDeleted: false,
  });

  if (!vehicle) {
    throw new ApiError(404, "Active vehicle not found");
  }

  const unavailable = await hasUnavailabilityConflict(
    vehicleId,
    fromDate,
    toDate
  );
  const booked = await hasBookingConflict(vehicleId, fromDate, toDate);
  const isAvailable = !unavailable && !booked;

  const durationHours = (toDate - fromDate) / (1000 * 60 * 60);
  const estimatedTotal = computeEstimatedTotal(vehicle.pricing, durationHours);

  return {
    available: isAvailable,
    vehicleId,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    estimatedTotal,
  };
};
