import { Router } from "express";
import { PUBLISHER_ROLES, ROLES } from "../constants.js";
import * as bookingController from "../controllers/booking.controller.js";
import {
  authorizeRoles,
  requireActiveAccount,
  requireEmailVerified,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  acceptBookingSchema,
  bookingListQuerySchema,
  cancelBookingSchema,
  completeBookingSchema,
  confirmPickupReadySchema,
  confirmVehicleSchema,
  createBookingSchema,
  createModificationRequestSchema,
  decideModificationRequestSchema,
  declineHandoverSchema,
  finalizePickupPointSchema,
  handoverSchema,
  rejectBookingSchema,
  reportVehicleUnavailableSchema,
} from "../validators/booking.validator.js";

const router = Router();

router.use(verifyJWT, requireActiveAccount);

// Customer endpoints
router.post(
  "/",
  authorizeRoles(ROLES.CUSTOMER),
  requireEmailVerified,
  validate({ body: createBookingSchema }),
  bookingController.createBooking
);

router.get(
  "/mine",
  authorizeRoles(ROLES.CUSTOMER),
  validate({ query: bookingListQuerySchema }),
  bookingController.getMyBookings
);

// Publisher received requests
router.get(
  "/received",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ query: bookingListQuerySchema }),
  bookingController.getReceivedBookings
);

// Detail endpoint (customer, publisher, admin)
router.get("/:id", bookingController.getBookingById);

// Backups endpoint (customer)
router.get(
  "/:id/backups",
  authorizeRoles(ROLES.CUSTOMER),
  bookingController.getBackupVehicles
);

// Publisher response actions
router.patch(
  "/:id/accept",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: acceptBookingSchema }),
  bookingController.acceptBooking
);

router.patch(
  "/:id/reject",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: rejectBookingSchema }),
  bookingController.rejectBooking
);

// Cancellation (customer or publisher)
router.patch(
  "/:id/cancel",
  authorizeRoles(ROLES.CUSTOMER, ...PUBLISHER_ROLES),
  validate({ body: cancelBookingSchema }),
  bookingController.cancelBooking
);

// Individual publisher sets exact pickup point
router.patch(
  "/:id/pickup-point",
  authorizeRoles(ROLES.INDIVIDUAL),
  validate({ body: finalizePickupPointSchema }),
  bookingController.finalizePickupPoint
);

// Pre-journey vehicle confirmation & optional swap
router.patch(
  "/:id/confirm-vehicle",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: confirmVehicleSchema }),
  bookingController.confirmVehicle
);

// Mandatory vehicle unavailability disclosure
router.patch(
  "/:id/report-vehicle-unavailable",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: reportVehicleUnavailableSchema }),
  bookingController.reportVehicleUnavailable
);

// Pre-pickup readiness confirmation
router.patch(
  "/:id/confirm-pickup-ready",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: confirmPickupReadySchema }),
  bookingController.confirmPickupReady
);

// Handover actions
router.patch(
  "/:id/handover",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: handoverSchema }),
  bookingController.recordHandover
);

router.patch(
  "/:id/decline-handover",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: declineHandoverSchema }),
  bookingController.declineHandover
);

// Customer marks picked up
router.patch(
  "/:id/mark-picked-up",
  authorizeRoles(ROLES.CUSTOMER),
  bookingController.markPickedUp
);

// Publisher marks no-show
router.patch(
  "/:id/mark-no-show",
  authorizeRoles(...PUBLISHER_ROLES),
  bookingController.markNoShow
);

// Trip completion
router.patch(
  "/:id/complete",
  authorizeRoles(ROLES.CUSTOMER, ...PUBLISHER_ROLES),
  validate({ body: completeBookingSchema }),
  bookingController.completeBooking
);

// Modification requests
router.post(
  "/:id/modification-requests",
  authorizeRoles(ROLES.CUSTOMER),
  validate({ body: createModificationRequestSchema }),
  bookingController.requestModification
);

router.patch(
  "/:id/modification-requests/:reqId",
  authorizeRoles(...PUBLISHER_ROLES),
  validate({ body: decideModificationRequestSchema }),
  bookingController.decideModification
);

export default router;

