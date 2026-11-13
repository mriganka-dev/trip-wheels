import { Router } from "express";
import { ROLES } from "../constants.js";
import * as publisherController from "../controllers/publisher.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import {
  authorizeRoles,
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import {
  checkFileSizeLimits,
  upload,
} from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updatePublisherProfileSchema,
  uploadDocumentSchema,
} from "../validators/publisher.validator.js";
import { reviewListQuerySchema } from "../validators/review.validator.js";

const router = Router();

// Public publisher reviews endpoint
router.get(
  "/:id/reviews",
  validate({ query: reviewListQuerySchema }),
  reviewController.getPublisherReviews
);

router.use(
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL)
);

router.put(
  "/profile",
  validate({ body: updatePublisherProfileSchema }),
  publisherController.updateProfile
);

router.get("/profile/me", publisherController.getOwnProfile);

router.post(
  "/documents",
  upload.single("file"),
  checkFileSizeLimits,
  validate({ body: uploadDocumentSchema }),
  publisherController.uploadDocument
);

router.get("/documents/me", publisherController.getOwnDocuments);

router.delete("/documents/:id", publisherController.deleteDocument);

router.post(
  "/selfie",
  authorizeRoles(ROLES.INDIVIDUAL),
  upload.single("selfie"),
  checkFileSizeLimits,
  publisherController.uploadSelfie
);

router.post("/submit-verification", publisherController.submitVerification);

export default router;
