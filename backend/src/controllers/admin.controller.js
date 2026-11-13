import * as adminService from "../services/admin.service.js";
import { getAuditLogs, logAudit } from "../services/audit.service.js";
import * as configService from "../services/config.service.js";
import * as publisherService from "../services/publisher.service.js";
import * as userService from "../services/user.service.js";
import * as vehicleService from "../services/vehicle.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getVerifications = asyncHandler(async (req, res) => {
  const result = await publisherService.getVerificationQueue(req.query);
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Verification queue fetched successfully")
    );
});

export const getVerificationById = asyncHandler(async (req, res) => {
  const detail = await publisherService.getVerificationDetail(
    req.params.publisherId
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, detail, "Publisher verification details fetched")
    );
});

export const recordVerificationCall = asyncHandler(async (req, res) => {
  const profile = await publisherService.recordVerificationCall(
    req.params.publisherId,
    req.user._id,
    req.body
  );

  await logAudit({
    actorId: req.user._id,
    action: "record_verification_call",
    targetType: "PublisherProfile",
    targetId: req.params.publisherId,
    after: { notes: req.body.notes, outcome: req.body.outcome },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Verification call recorded successfully")
    );
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const document = await publisherService.reviewDocument(
    req.params.docId,
    req.user._id,
    req.body
  );

  await logAudit({
    actorId: req.user._id,
    action: "review_document",
    targetType: "VerificationDocument",
    targetId: req.params.docId,
    after: {
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
    },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, document, "Document reviewed successfully"));
});

export const approveVerification = asyncHandler(async (req, res) => {
  const profile = await publisherService.approveVerification(
    req.params.publisherId,
    req.user._id
  );

  await logAudit({
    actorId: req.user._id,
    action: "approve_verification",
    targetType: "PublisherProfile",
    targetId: req.params.publisherId,
    after: { verificationStatus: "approved" },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Publisher profile approved successfully")
    );
});

export const rejectVerification = asyncHandler(async (req, res) => {
  const profile = await publisherService.rejectVerification(
    req.params.publisherId,
    req.user._id,
    req.body
  );

  await logAudit({
    actorId: req.user._id,
    action: "reject_verification",
    targetType: "PublisherProfile",
    targetId: req.params.publisherId,
    after: { verificationStatus: "rejected", reason: req.body.reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        "Publisher verification rejected successfully"
      )
    );
});

export const requestReverification = asyncHandler(async (req, res) => {
  const profile = await publisherService.requestReverification(
    req.params.publisherId,
    req.user._id,
    req.body
  );

  await logAudit({
    actorId: req.user._id,
    action: "request_reverification",
    targetType: "PublisherProfile",
    targetId: req.params.publisherId,
    after: {
      verificationStatus: "reverification_required",
      reason: req.body.reason,
    },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Reverification requested from publisher")
    );
});

export const confirmPhone = asyncHandler(async (req, res) => {
  const user = await publisherService.confirmUserPhone(
    req.params.userId,
    req.user._id
  );

  await logAudit({
    actorId: req.user._id,
    action: "confirm_phone",
    targetType: "User",
    targetId: req.params.userId,
    after: { phoneConfirmedByAdmin: true },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, user, "User phone confirmed successfully"));
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await publisherService.suspendUser(
    req.params.userId,
    req.body.reason
  );

  await logAudit({
    actorId: req.user._id,
    action: "suspend_user",
    targetType: "User",
    targetId: req.params.userId,
    after: { accountStatus: "suspended", reason: req.body.reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, user, "User suspended successfully"));
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await publisherService.unsuspendUser(req.params.userId);

  await logAudit({
    actorId: req.user._id,
    action: "unsuspend_user",
    targetType: "User",
    targetId: req.params.userId,
    after: { accountStatus: "active" },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, user, "User unsuspended successfully"));
});

// Admin Vehicle Moderation

export const getAdminVehicles = asyncHandler(async (req, res) => {
  const result = await vehicleService.getAdminVehicles(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Admin vehicles list fetched"));
});

export const approveVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.adminApproveVehicle(req.params.id);

  await logAudit({
    actorId: req.user._id,
    action: "approve_vehicle",
    targetType: "Vehicle",
    targetId: req.params.id,
    after: { status: "active" },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle approved successfully"));
});

export const rejectVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.adminRejectVehicle(
    req.params.id,
    req.body.reason
  );

  await logAudit({
    actorId: req.user._id,
    action: "reject_vehicle",
    targetType: "Vehicle",
    targetId: req.params.id,
    after: { status: "rejected", reason: req.body.reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle rejected successfully"));
});

export const suspendVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.adminSuspendVehicle(
    req.params.id,
    req.body.reason
  );

  await logAudit({
    actorId: req.user._id,
    action: "suspend_vehicle",
    targetType: "Vehicle",
    targetId: req.params.id,
    after: { status: "suspended", reason: req.body.reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle suspended successfully"));
});

// Plan 8 New Endpoints

export const getDashboard = asyncHandler(async (req, res) => {
  const counts = await adminService.getDashboardCounts();
  res
    .status(200)
    .json(new ApiResponse(200, counts, "Admin dashboard counts fetched"));
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAdminUsers(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users list fetched for admin"));
});

export const getAdminUserDetail = asyncHandler(async (req, res) => {
  const result = await adminService.getAdminUserDetail(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, result, "User details fetched for admin"));
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await configService.getSettings();
  res
    .status(200)
    .json(new ApiResponse(200, settings, "Business settings fetched"));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const before = await configService.getSettings();
  const updated = await configService.updateSettings(req.body);

  await logAudit({
    actorId: req.user._id,
    action: "update_settings",
    targetType: "Setting",
    targetId: "default_settings",
    before,
    after: updated,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, updated, "Business settings updated successfully")
    );
});

export const getAuditLogsList = asyncHandler(async (req, res) => {
  const result = await getAuditLogs(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Audit logs fetched successfully"));
});

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const overview = await adminService.getAnalyticsOverview(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, overview, "Analytics overview fetched"));
});

export const getAnalyticsDestinations = asyncHandler(async (req, res) => {
  const results = await adminService.getAnalyticsDestinations();
  res
    .status(200)
    .json(new ApiResponse(200, results, "Destination analytics fetched"));
});

export const getIndividualMisclassification = asyncHandler(async (req, res) => {
  const flags = await adminService.getIndividualMisclassificationFlags();
  res
    .status(200)
    .json(
      new ApiResponse(200, flags, "Individual misclassification flags fetched")
    );
});

export const getInsuranceExpiryWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await adminService.getInsuranceExpiryWatchlist();
  res
    .status(200)
    .json(
      new ApiResponse(200, watchlist, "Insurance expiry watchlist fetched")
    );
});

export const exportResource = asyncHandler(async (req, res) => {
  const csvContent = await adminService.exportResourceCsv(req.params.resource);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${req.params.resource}-${Date.now()}.csv"`
  );
  res.status(200).send(csvContent);
});

export const anonymizeUser = asyncHandler(async (req, res) => {
  const result = await userService.anonymizeUser(
    req.params.userId,
    req.user._id
  );

  await logAudit({
    actorId: req.user._id,
    action: "anonymize_user",
    targetType: "User",
    targetId: req.params.userId,
    after: { accountStatus: "suspended", anonymized: true },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, result, "User anonymized successfully by admin")
    );
});
