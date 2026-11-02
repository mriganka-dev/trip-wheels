import {
  ADMIN_TASK_STATUS,
  BOOKING_STATUS,
  BUSINESS_DEFAULTS,
  ISSUE_STATUS,
  ROLES,
  VEHICLE_STATUS,
  VERIFICATION_STATUS,
} from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { Booking } from "../models/booking.model.js";
import { Destination } from "../models/destination.model.js";
import { Issue } from "../models/issue.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { VerificationDocument } from "../models/verificationDocument.model.js";
import { ApiError } from "../utils/ApiError.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";
import { getSetting } from "./config.service.js";

export const getDashboardCounts = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [
    pendingVerifications,
    pendingVehicles,
    openIssues,
    openTasks,
    requestsAwaitingResponse,
    upcomingPickups24h,
    unconfirmedVehicles24h,
  ] = await Promise.all([
    PublisherProfile.countDocuments({
      verificationStatus: VERIFICATION_STATUS.PENDING,
    }),
    Vehicle.countDocuments({
      status: VEHICLE_STATUS.PENDING_REVIEW,
      isDeleted: false,
    }),
    Issue.countDocuments({
      status: { $in: [ISSUE_STATUS.OPEN, ISSUE_STATUS.UNDER_REVIEW] },
    }),
    AdminTask.countDocuments({
      status: ADMIN_TASK_STATUS.OPEN,
    }),
    Booking.countDocuments({
      status: BOOKING_STATUS.REQUESTED,
    }),
    Booking.countDocuments({
      status: BOOKING_STATUS.CONFIRMED,
      startAt: { $gte: now, $lte: in24h },
    }),
    Booking.countDocuments({
      status: BOOKING_STATUS.CONFIRMED,
      startAt: { $gte: now, $lte: in24h },
      "vehicleConfirmation.confirmedAt": null,
    }),
  ]);

  return {
    pendingVerifications,
    pendingVehicles,
    openIssues,
    openTasks,
    requestsAwaitingResponse,
    upcomingPickups24h,
    unconfirmedVehicles24h,
  };
};

export const getAdminUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.role) {
    filter.role = query.role;
  }
  if (query.accountStatus) {
    filter.accountStatus = query.accountStatus;
  }
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { fullName: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }

  const totalItems = await User.countDocuments(filter);
  const items = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const getAdminUserDetail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const data = { user };

  if ([ROLES.AGENT, ROLES.INDIVIDUAL].includes(user.role)) {
    const profile = await PublisherProfile.findOne({ user: user._id });
    const documents = await VerificationDocument.find({
      publisherProfile: profile?._id,
    });
    const vehicles = await Vehicle.find({
      publisher: user._id,
      isDeleted: false,
    });

    data.profile = profile;
    data.documents = documents;
    data.vehicles = vehicles;
  }

  return data;
};

export const getAnalyticsOverview = async (query) => {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = query.from ? new Date(query.from) : defaultFrom;
  const to = query.to ? new Date(query.to) : now;

  const dateFilter = { createdAt: { $gte: from, $lte: to } };

  // 1. Booking counts
  const allBookings = await Booking.find(dateFilter).select(
    "status createdAt respondedAt confirmedAt vehicleConfirmation unavailability startAt endAt"
  );

  const requestsCreated = allBookings.length;
  let acceptedCount = 0;
  let rejectedCount = 0;
  let expiredCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let noShowCount = 0;
  let totalResponseMinutes = 0;
  let respondedBookingsCount = 0;
  let vehicleConfirmationMissedCount = 0;
  let lateDisclosureCount = 0;
  let totalUnavailabilityCount = 0;

  for (const b of allBookings) {
    if (
      b.status === BOOKING_STATUS.CONFIRMED ||
      b.status === BOOKING_STATUS.ONGOING ||
      b.status === BOOKING_STATUS.COMPLETED
    ) {
      acceptedCount++;
    } else if (b.status === BOOKING_STATUS.REJECTED) {
      rejectedCount++;
    } else if (b.status === BOOKING_STATUS.EXPIRED) {
      expiredCount++;
    }

    if (b.status === BOOKING_STATUS.COMPLETED) {
      completedCount++;
    } else if (
      b.status === BOOKING_STATUS.CANCELLED_BY_CUSTOMER ||
      b.status === BOOKING_STATUS.CANCELLED_BY_PUBLISHER
    ) {
      cancelledCount++;
    } else if (b.status === BOOKING_STATUS.NO_SHOW) {
      noShowCount++;
    }

    if (b.respondedAt && b.createdAt) {
      const diffMin =
        (new Date(b.respondedAt).getTime() - new Date(b.createdAt).getTime()) /
        60000;
      if (diffMin > 0) {
        totalResponseMinutes += diffMin;
        respondedBookingsCount++;
      }
    }

    if (b.vehicleConfirmation?.missedAt) {
      vehicleConfirmationMissedCount++;
    }

    if (b.unavailability?.reportedAt) {
      totalUnavailabilityCount++;
      if (b.unavailability.lateDisclosure) {
        lateDisclosureCount++;
      }
    }
  }

  const totalDecided = acceptedCount + rejectedCount + expiredCount;
  const acceptanceRate =
    totalDecided > 0 ? Math.round((acceptedCount / totalDecided) * 100) : 0;
  const rejectionRate =
    totalDecided > 0 ? Math.round((rejectedCount / totalDecided) * 100) : 0;
  const expiryRate =
    totalDecided > 0 ? Math.round((expiredCount / totalDecided) * 100) : 0;
  const avgResponseMinutes =
    respondedBookingsCount > 0
      ? Math.round(totalResponseMinutes / respondedBookingsCount)
      : 0;

  const totalFinishedOrCancelled = completedCount + cancelledCount;
  const completionRate =
    totalFinishedOrCancelled > 0
      ? Math.round((completedCount / totalFinishedOrCancelled) * 100)
      : 0;
  const cancellationRate =
    requestsCreated > 0
      ? Math.round((cancelledCount / requestsCreated) * 100)
      : 0;
  const noShowRate =
    acceptedCount > 0 ? Math.round((noShowCount / acceptedCount) * 100) : 0;
  const vehicleConfirmationMissedRate =
    acceptedCount > 0
      ? Math.round((vehicleConfirmationMissedCount / acceptedCount) * 100)
      : 0;
  const lateDisclosureRate =
    totalUnavailabilityCount > 0
      ? Math.round((lateDisclosureCount / totalUnavailabilityCount) * 100)
      : 0;

  // 2. Issues analytics
  const issuesInRange = await Issue.find(dateFilter).select(
    "status createdAt resolution"
  );
  const issueRate =
    completedCount > 0
      ? Math.round((issuesInRange.length / completedCount) * 100)
      : 0;

  let totalResolutionHours = 0;
  let resolvedIssuesCount = 0;
  for (const iss of issuesInRange) {
    if (iss.resolution?.resolvedAt && iss.createdAt) {
      const diffHours =
        (new Date(iss.resolution.resolvedAt).getTime() -
          new Date(iss.createdAt).getTime()) /
        3600000;
      if (diffHours >= 0) {
        totalResolutionHours += diffHours;
        resolvedIssuesCount++;
      }
    }
  }
  const avgIssueResolutionHours =
    resolvedIssuesCount > 0
      ? Math.round(totalResolutionHours / resolvedIssuesCount)
      : 0;

  // 3. Active counts
  const [activePublishers, activeVehicles] = await Promise.all([
    PublisherProfile.countDocuments({
      verificationStatus: VERIFICATION_STATUS.APPROVED,
    }),
    Vehicle.countDocuments({ status: VEHICLE_STATUS.ACTIVE, isDeleted: false }),
  ]);

  return {
    dateRange: { from, to },
    requestsCreated,
    acceptanceRate,
    rejectionRate,
    expiryRate,
    avgResponseMinutes,
    completionRate,
    cancellationRate,
    noShowRate,
    vehicleConfirmationMissedRate,
    lateDisclosureRate,
    issueRate,
    avgIssueResolutionHours,
    activePublishers,
    activeVehicles,
  };
};

export const getAnalyticsDestinations = async () => {
  const destinations = await Destination.find({ isPilot: true });

  const results = [];
  for (const dest of destinations) {
    const vehicleIds = await Vehicle.find({
      destination: dest._id,
      isDeleted: false,
    }).distinct("_id");

    const [totalRequests, completedBookings, activeVehiclesCount] =
      await Promise.all([
        Booking.countDocuments({ vehicle: { $in: vehicleIds } }),
        Booking.countDocuments({
          vehicle: { $in: vehicleIds },
          status: BOOKING_STATUS.COMPLETED,
        }),
        Vehicle.countDocuments({
          destination: dest._id,
          status: VEHICLE_STATUS.ACTIVE,
          isDeleted: false,
        }),
      ]);

    results.push({
      destination: {
        _id: dest._id,
        name: dest.name,
        slug: dest.slug,
        state: dest.state,
      },
      totalRequests,
      completedBookings,
      activeVehicles: activeVehiclesCount,
    });
  }

  return results;
};

export const getIndividualMisclassificationFlags = async () => {
  // Check individual publishers that exceed cap or have suspicious booking patterns
  const individualProfiles = await PublisherProfile.find({
    publisherType: ROLES.INDIVIDUAL,
  }).populate("user", "fullName email phone accountStatus");

  const flagged = [];

  for (const profile of individualProfiles) {
    const vehicleCount = await Vehicle.countDocuments({
      publisher: profile.user._id,
      isDeleted: false,
    });

    // Check completed bookings in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCompletedCount = await Booking.countDocuments({
      publisher: profile.user._id,
      status: BOOKING_STATUS.COMPLETED,
      updatedAt: { $gte: thirtyDaysAgo },
    });

    const reasons = [];
    if (vehicleCount > BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES) {
      reasons.push(
        `Exceeded individual vehicle cap: ${vehicleCount} vehicles (max allowed: ${BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES})`
      );
    }

    if (recentCompletedCount >= 15) {
      reasons.push(
        `High commercial booking volume: ${recentCompletedCount} trips completed in 30 days`
      );
    }

    if (reasons.length > 0) {
      flagged.push({
        publisher: profile.user,
        profileId: profile._id,
        vehicleCount,
        completedTrips30d: recentCompletedCount,
        reasons,
      });
    }
  }

  return flagged;
};

export const getInsuranceExpiryWatchlist = async () => {
  const now = new Date();
  const warningWindowDays = await getSetting("INSURANCE_EXPIRY_WARNING_DAYS");
  const maxWarningDays = Math.max(...(warningWindowDays || [30, 7, 1]));

  const thresholdDate = new Date(
    now.getTime() + maxWarningDays * 24 * 60 * 60 * 1000
  );

  const vehicles = await Vehicle.find({
    "insurance.expiresAt": { $lte: thresholdDate },
    isDeleted: false,
  })
    .populate("publisher", "fullName email phone")
    .populate("destination", "name slug")
    .sort({ "insurance.expiresAt": 1 });

  return vehicles.map((v) => {
    const expiresAt = new Date(v.insurance.expiresAt);
    const diffMs = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      _id: v._id,
      brand: v.brand,
      model: v.model,
      registrationNumber: v.registrationNumber,
      status: v.status,
      insurancePolicyNumber: v.insurance?.policyNumber || "",
      insuranceExpiresAt: v.insurance?.expiresAt,
      daysRemaining,
      isExpired: daysRemaining <= 0,
      publisher: v.publisher,
      destination: v.destination,
    };
  });
};

const escapeCsv = (str) => {
  if (str === null || str === undefined) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
};

export const exportResourceCsv = async (resource) => {
  const ALLOWLIST = ["users", "vehicles", "bookings", "issues"];
  if (!ALLOWLIST.includes(resource)) {
    throw new ApiError(
      400,
      `Invalid resource for export. Allowlist: ${ALLOWLIST.join(", ")}`
    );
  }

  let headers = [];
  let rows = [];

  if (resource === "users") {
    headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Email Verified",
      "Created At",
    ];
    const users = await User.find({}).sort({ createdAt: -1 }).limit(10000);
    rows = users.map((u) => [
      escapeCsv(u._id),
      escapeCsv(u.fullName),
      escapeCsv(u.email),
      escapeCsv(u.phone),
      escapeCsv(u.role),
      escapeCsv(u.accountStatus),
      escapeCsv(u.isEmailVerified),
      escapeCsv(u.createdAt?.toISOString()),
    ]);
  } else if (resource === "vehicles") {
    headers = [
      "ID",
      "Type",
      "Brand",
      "Model",
      "Year",
      "Status",
      "Per Day Price",
      "Publisher ID",
      "Created At",
    ];
    const vehicles = await Vehicle.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10000);
    rows = vehicles.map((v) => [
      escapeCsv(v._id),
      escapeCsv(v.type),
      escapeCsv(v.brand),
      escapeCsv(v.model),
      escapeCsv(v.year),
      escapeCsv(v.status),
      escapeCsv(v.pricing?.perDay),
      escapeCsv(v.publisher),
      escapeCsv(v.createdAt?.toISOString()),
    ]);
  } else if (resource === "bookings") {
    headers = [
      "ID",
      "Code",
      "Customer ID",
      "Publisher ID",
      "Vehicle ID",
      "Status",
      "Start At",
      "End At",
      "Duration Hours",
      "Estimated Total",
      "Created At",
    ];
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(10000);
    rows = bookings.map((b) => [
      escapeCsv(b._id),
      escapeCsv(b.bookingCode),
      escapeCsv(b.customer),
      escapeCsv(b.publisher),
      escapeCsv(b.vehicle),
      escapeCsv(b.status),
      escapeCsv(b.startAt?.toISOString()),
      escapeCsv(b.endAt?.toISOString()),
      escapeCsv(b.durationHours),
      escapeCsv(b.pricingSnapshot?.estimatedTotal),
      escapeCsv(b.createdAt?.toISOString()),
    ]);
  } else if (resource === "issues") {
    headers = [
      "ID",
      "Booking ID",
      "Raised By",
      "Raised Against",
      "Type",
      "Severity",
      "Status",
      "Outcome",
      "Created At",
    ];
    const issues = await Issue.find({}).sort({ createdAt: -1 }).limit(10000);
    rows = issues.map((i) => [
      escapeCsv(i._id),
      escapeCsv(i.booking),
      escapeCsv(i.raisedBy),
      escapeCsv(i.raisedAgainst),
      escapeCsv(i.type),
      escapeCsv(i.severity),
      escapeCsv(i.status),
      escapeCsv(i.resolution?.outcome || ""),
      escapeCsv(i.createdAt?.toISOString()),
    ]);
  }

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );
  return csvContent;
};
