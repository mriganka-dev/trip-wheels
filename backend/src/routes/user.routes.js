import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import {
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import {
  checkFileSizeLimits,
  upload,
} from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updateNotificationPreferencesSchema,
  updateProfileSchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(verifyJWT, requireActiveAccount);

router.get("/me", userController.getCurrentUser);

router.patch(
  "/me",
  validate({ body: updateProfileSchema }),
  userController.updateProfile
);

router.patch(
  "/me/avatar",
  upload.single("avatar"),
  checkFileSizeLimits,
  userController.updateAvatar
);

router.patch(
  "/me/notification-preferences",
  validate({ body: updateNotificationPreferencesSchema }),
  userController.updateNotificationPreferences
);

router.post("/anonymize", userController.anonymizeMe);

export default router;
