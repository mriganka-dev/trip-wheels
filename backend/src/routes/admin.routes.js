import { Router } from "express";
import { ROLES } from "../constants.js";
import * as adminController from "../controllers/admin.controller.js";
import * as bookingController from "../controllers/booking.controller.js";
import * as destinationController from "../controllers/destination.controller.js";
import * as issueController from "../controllers/issue.controller.js";
import * as notificationController from "../controllers/notification.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import {
  authorizeRoles,
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  adminBookingListQuerySchema,
  adminOverrideBookingStatusSchema,
} from "../validators/booking.validator.js";
import {
  issueListQuerySchema,
  resolveAdminIssueSchema,
} from "../validators/issue.validator.js";
import { hideReviewSchema } from "../validators/review.validator.js";
import {
  createDestinationSchema,
  updateDestinationSchema,
} from "../validators/destination.validator.js";
import { updateAdminTaskSchema } from "../validators/notification.validator.js";
import {
  adminRejectionSchema,
  adminReviewDocumentSchema,
  adminSuspendUserSchema,
  adminVerificationCallSchema,
} from "../validators/publisher.validator.js";
import { adminVehicleRejectSchema } from "../validators/vehicle.validator.js";

const router = Router();

router.use(verifyJWT, requireActiveAccount, authorizeRoles(ROLES.ADMIN));

// Verification Queue
router.get("/verifications", adminController.getVerifications);

router.get("/verifications/:publisherId", adminController.getVerificationById);

router.patch(
  "/verifications/:publisherId/verification-call",
  validate({ body: adminVerificationCallSchema }),
  adminController.recordVerificationCall
);

router.patch(
  "/verifications/:publisherId/documents/:docId",
  validate({ body: adminReviewDocumentSchema }),
  adminController.reviewDocument
);

router.patch(
  "/verifications/:publisherId/approve",
  adminController.approveVerification
);

router.patch(
  "/verifications/:publisherId/reject",
  validate({ body: adminRejectionSchema }),
  adminController.rejectVerification
);

router.patch(
  "/verifications/:publisherId/request-reverification",
  validate({ body: adminRejectionSchema }),
  adminController.requestReverification
);

router.patch("/users/:userId/confirm-phone", adminController.confirmPhone);

router.patch(
  "/users/:userId/suspend",
  validate({ body: adminSuspendUserSchema }),
  adminController.suspendUser
);

router.patch("/users/:userId/unsuspend", adminController.unsuspendUser);

// Destination Management
router.get("/destinations", destinationController.getAllDestinations);

router.post(
  "/destinations",
  validate({ body: createDestinationSchema }),
  destinationController.createDestination
);

router.patch(
  "/destinations/:id",
  validate({ body: updateDestinationSchema }),
  destinationController.updateDestination
);

// Vehicle Moderation
router.get("/vehicles", adminController.getAdminVehicles);

router.patch("/vehicles/:id/approve", adminController.approveVehicle);

router.patch(
  "/vehicles/:id/reject",
  validate({ body: adminVehicleRejectSchema }),
  adminController.rejectVehicle
);

router.patch("/vehicles/:id/suspend", adminController.suspendVehicle);

// Admin Tasks
router.get("/tasks", notificationController.getAdminTasks);

router.patch(
  "/tasks/:id",
  validate({ body: updateAdminTaskSchema }),
  notificationController.updateAdminTask
);

// Admin Booking Management
router.get(
  "/bookings",
  validate({ query: adminBookingListQuerySchema }),
  bookingController.getAdminBookings
);

router.patch(
  "/bookings/:id/status",
  validate({ body: adminOverrideBookingStatusSchema }),
  bookingController.adminOverrideStatus
);

// Admin Issues Management
router.get(
  "/issues",
  validate({ query: issueListQuerySchema }),
  issueController.getAdminIssues
);

router.patch(
  "/issues/:id",
  validate({ body: resolveAdminIssueSchema }),
  issueController.resolveAdminIssue
);

// Admin Review Moderation
router.patch(
  "/reviews/:id/hide",
  validate({ body: hideReviewSchema }),
  reviewController.hideReview
);

export default router;
