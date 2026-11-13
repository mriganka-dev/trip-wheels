import fs from "fs";
import {
  ADMIN_TASK_TYPES,
  BOOKING_STATUS,
  BUSINESS_DEFAULTS,
  ISSUE_RESOLUTION_OUTCOMES,
  ISSUE_STATUS,
  ISSUE_TYPES,
  NOTIFICATION_EVENTS,
  ROLES,
  VEHICLE_STATUS,
} from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { Booking } from "../models/booking.model.js";
import { Issue } from "../models/issue.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { notify, notifyAdmins } from "../notifications/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";
import { logAudit } from "./audit.service.js";
import {
  recomputeCustomerReliability,
  recomputePublisherReliability,
} from "./reliability.service.js";

const ALLOWED_ISSUE_BOOKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ONGOING,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.HANDOVER_DECLINED,
  BOOKING_STATUS.NO_SHOW,
  BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
  BOOKING_STATUS.CANCELLED_BY_PUBLISHER,
  BOOKING_STATUS.VEHICLE_UNAVAILABLE,
];

export const raiseIssue = async (user, bookingId, data, files = []) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (!ALLOWED_ISSUE_BOOKING_STATUSES.includes(booking.status)) {
    throw new ApiError(
      400,
      `Issues cannot be raised for bookings in '${booking.status}' status`
    );
  }

  // If completed, verify window (7 days)
  if (booking.status === BOOKING_STATUS.COMPLETED) {
    const completedAt =
      booking.completion?.completedAt || booking.updatedAt || booking.endAt;
    const daysPassed =
      (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysPassed > BUSINESS_DEFAULTS.ISSUE_WINDOW_DAYS_AFTER_COMPLETION) {
      throw new ApiError(
        400,
        `Issue window of ${BUSINESS_DEFAULTS.ISSUE_WINDOW_DAYS_AFTER_COMPLETION} days after completion has passed`
      );
    }
  }

  const userId = user._id.toString();
  const isCustomer = userId === booking.customer.toString();
  const isPublisher = userId === booking.publisher.toString();

  if (!isCustomer && !isPublisher) {
    throw new ApiError(
      403,
      "Only participants of this booking can raise an issue"
    );
  }

  const raisedBy = user._id;
  const raisedAgainst = isCustomer ? booking.publisher : booking.customer;

  // Upload evidence images if provided
  const evidence = [];
  if (Array.isArray(files) && files.length > 0) {
    for (const file of files.slice(0, 6)) {
      try {
        const uploadResult = await uploadOnCloudinary(file.path, {
          folder: "trip-wheels/issues",
        });
        if (uploadResult) {
          evidence.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
          });
        }
      } catch (err) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
  }

  const now = new Date();
  const issue = await Issue.create({
    booking: booking._id,
    raisedBy,
    raisedAgainst,
    type: data.type,
    description: data.description,
    severity: data.severity || "medium",
    evidence,
    status: ISSUE_STATUS.OPEN,
    timeline: [
      {
        at: now,
        by: user._id,
        note: `Issue raised by ${isCustomer ? "customer" : "publisher"} (${data.type})`,
      },
    ],
  });

  // Flag booking with open issue
  booking.hasOpenIssue = true;
  await booking.save();

  // Create Admin Task
  await AdminTask.create({
    type: ADMIN_TASK_TYPES.REVIEW_ISSUE,
    booking: booking._id,
    publisher: isCustomer ? booking.publisher : null,
    details: {
      issueId: issue._id,
      type: issue.type,
      severity: issue.severity,
      bookingCode: booking.bookingCode,
    },
  });

  // Notify the other party
  notify({
    userId: raisedAgainst,
    event: NOTIFICATION_EVENTS.ISSUE_RAISED,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      issueId: issue._id,
    },
  }).catch((err) => console.error("Notification error:", err));

  // Notify Admin
  notifyAdmins(NOTIFICATION_EVENTS.ISSUE_RAISED, {
    bookingId: booking._id,
    bookingCode: booking.bookingCode,
    issueId: issue._id,
    severity: issue.severity,
  }).catch((err) => console.error("Admin notification error:", err));

  return issue;
};

export const getMyIssues = async (user, query) => {
  const { page, limit, skip } = getPagination(query);

  const filter = {
    $or: [{ raisedBy: user._id }, { raisedAgainst: user._id }],
  };

  if (query.status) {
    filter.status = query.status;
  }

  const totalItems = await Issue.countDocuments(filter);
  const items = await Issue.find(filter)
    .populate("raisedBy", "fullName email")
    .populate("raisedAgainst", "fullName email")
    .populate("booking", "bookingCode status startAt endAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const getIssueById = async (user, issueId) => {
  const issue = await Issue.findById(issueId)
    .populate("raisedBy", "fullName phone email")
    .populate("raisedAgainst", "fullName phone email")
    .populate(
      "booking",
      "bookingCode status startAt endAt vehicle assignedVehicle"
    );

  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  const userId = user._id.toString();
  const isParticipant =
    userId === issue.raisedBy._id.toString() ||
    userId === issue.raisedAgainst._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isParticipant && !isAdmin) {
    throw new ApiError(403, "Access denied to this issue");
  }

  return issue;
};

export const respondToIssue = async (user, issueId, text) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  if (issue.raisedAgainst.toString() !== user._id.toString()) {
    throw new ApiError(
      403,
      "Only the respondent can add a response to this issue"
    );
  }

  const now = new Date();
  issue.response = {
    text: text.trim(),
    at: now,
  };

  issue.timeline.push({
    at: now,
    by: user._id,
    note: "Response submitted by respondent",
  });

  await issue.save();

  // Notify the user who raised it
  notify({
    userId: issue.raisedBy,
    event: NOTIFICATION_EVENTS.ISSUE_RESPONDED,
    data: {
      issueId: issue._id,
      bookingId: issue.booking,
    },
  }).catch((err) => console.error("Notification error:", err));

  return issue;
};

export const getAdminIssues = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.type) {
    filter.type = query.type;
  }
  if (query.severity) {
    filter.severity = query.severity;
  }

  const totalItems = await Issue.countDocuments(filter);
  const items = await Issue.find(filter)
    .populate("raisedBy", "fullName email")
    .populate("raisedAgainst", "fullName email")
    .populate("booking", "bookingCode status")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const resolveAdminIssue = async (adminUser, issueId, data) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  const now = new Date();
  const outcome = data.outcome;
  const isUpheld = outcome === ISSUE_RESOLUTION_OUTCOMES.UPHELD;

  issue.status = data.status || ISSUE_STATUS.RESOLVED;
  issue.resolution = {
    outcome,
    adminNote: data.adminNote || "",
    penaltyApplied: Boolean(data.penaltyApplied),
    resolvedBy: adminUser._id,
    resolvedAt: now,
  };

  issue.timeline.push({
    at: now,
    by: adminUser._id,
    note: `Admin resolved issue with outcome: ${outcome}. ${data.adminNote || ""}`,
  });

  await issue.save();

  await logAudit({
    actorId: adminUser._id,
    action: "resolve_issue",
    targetType: "Issue",
    targetId: issue._id,
    after: { outcome, adminNote: data.adminNote, status: issue.status },
  });

  // If issue was upheld, apply penalties and optional suspensions
  if (isUpheld) {
    const booking = await Booking.findById(issue.booking);
    const againstId = issue.raisedAgainst.toString();

    // Check if againstId is publisher or customer
    if (booking && againstId === booking.publisher.toString()) {
      // Applied against publisher
      const isUndisclosedUnavailability =
        issue.type === ISSUE_TYPES.VEHICLE_UNAVAILABLE_AT_PICKUP;

      const incFields = { "reliability.issuesUpheld": 1 };
      if (isUndisclosedUnavailability) {
        incFields["reliability.undisclosedUnavailability"] = 1;
      }

      await PublisherProfile.findOneAndUpdate(
        { user: booking.publisher },
        { $inc: incFields }
      );

      await recomputePublisherReliability(booking.publisher);

      if (data.suspendPublisher) {
        await User.findByIdAndUpdate(booking.publisher, {
          accountStatus: "suspended",
        });
      }

      if (data.suspendVehicle && (booking.assignedVehicle || booking.vehicle)) {
        await Vehicle.findByIdAndUpdate(
          booking.assignedVehicle || booking.vehicle,
          { status: VEHICLE_STATUS.SUSPENDED }
        );
      }
    } else {
      // Applied against customer
      await User.findByIdAndUpdate(againstId, {
        $inc: { "reliability.issuesUpheld": 1 },
      });

      await recomputeCustomerReliability(againstId);

      if (data.suspendCustomer) {
        await User.findByIdAndUpdate(againstId, {
          accountStatus: "suspended",
        });
      }
    }
  }

  // Check remaining open issues on booking
  const openCount = await Issue.countDocuments({
    booking: issue.booking,
    status: { $in: [ISSUE_STATUS.OPEN, ISSUE_STATUS.UNDER_REVIEW] },
  });

  if (openCount === 0) {
    await Booking.findByIdAndUpdate(issue.booking, { hasOpenIssue: false });
  }

  // Notify both sides
  notify({
    userId: issue.raisedBy,
    event: NOTIFICATION_EVENTS.ISSUE_RESOLVED,
    data: {
      issueId: issue._id,
      outcome,
    },
  }).catch((err) => console.error("Notification error:", err));

  notify({
    userId: issue.raisedAgainst,
    event: NOTIFICATION_EVENTS.ISSUE_RESOLVED,
    data: {
      issueId: issue._id,
      outcome,
    },
  }).catch((err) => console.error("Notification error:", err));

  return issue;
};
