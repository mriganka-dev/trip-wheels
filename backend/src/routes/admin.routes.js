import { Router } from "express";
import { ROLES } from "../constants.js";
import * as adminController from "../controllers/admin.controller.js";
import {
  authorizeRoles,
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  adminRejectionSchema,
  adminReviewDocumentSchema,
  adminSuspendUserSchema,
  adminVerificationCallSchema,
} from "../validators/publisher.validator.js";

const router = Router();

router.use(verifyJWT, requireActiveAccount, authorizeRoles(ROLES.ADMIN));

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

export default router;
