import { Router } from "express";
import { ROLES } from "../constants.js";
import * as notificationController from "../controllers/notification.controller.js";
import {
  authorizeRoles,
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  removePushSubscriptionSchema,
  savePushSubscriptionSchema,
} from "../validators/notification.validator.js";

const router = Router();

router.use(verifyJWT, requireActiveAccount);

router.get("/", notificationController.getNotifications);

router.patch("/read-all", notificationController.markAllRead);

router.patch("/:id/read", notificationController.markRead);

router.get("/vapid-public-key", notificationController.getVapidPublicKey);

router.post(
  "/push-subscriptions",
  validate({ body: savePushSubscriptionSchema }),
  notificationController.savePushSubscription
);

router.delete(
  "/push-subscriptions",
  validate({ body: removePushSubscriptionSchema }),
  notificationController.removePushSubscription
);

router.post(
  "/test",
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  notificationController.sendTestNotification
);

router.post(
  "/test/confirm",
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  notificationController.confirmTestNotification
);

export default router;
