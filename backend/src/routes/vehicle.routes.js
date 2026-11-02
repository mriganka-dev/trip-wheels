import { Router } from "express";
import { ROLES } from "../constants.js";
import * as vehicleController from "../controllers/vehicle.controller.js";
import {
  authorizeRoles,
  requireActiveAccount,
  requireApprovedPublisher,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import {
  checkFileSizeLimits,
  upload,
} from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  availabilityQuerySchema,
  createVehicleSchema,
  searchVehiclesSchema,
  submitVehicleDocsSchema,
  unavailabilitySchema,
  updateVehicleSchema,
} from "../validators/vehicle.validator.js";

const router = Router();

// Public routes
router.get(
  "/search",
  validate({ query: searchVehiclesSchema }),
  vehicleController.searchVehicles
);

router.get(
  "/:id/availability",
  validate({ query: availabilityQuerySchema }),
  vehicleController.checkAvailability
);

// Publisher route to get own vehicles
router.get(
  "/mine",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.getMyVehicles
);

// Public single vehicle detail
router.get("/:id", vehicleController.getPublicVehicle);

// Protected vehicle management routes
router.post(
  "/",
  verifyJWT,
  requireActiveAccount,
  requireApprovedPublisher,
  validate({ body: createVehicleSchema }),
  vehicleController.createVehicle
);

router.patch(
  "/:id",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  validate({ body: updateVehicleSchema }),
  vehicleController.updateVehicle
);

router.post(
  "/:id/images",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  upload.array("images", 10),
  checkFileSizeLimits,
  vehicleController.uploadImages
);

router.delete(
  "/:id/images/:imageId",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.deleteImage
);

router.post(
  "/:id/documents",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  upload.fields([
    { name: "rc", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "noc", maxCount: 1 },
  ]),
  checkFileSizeLimits,
  validate({ body: submitVehicleDocsSchema }),
  vehicleController.uploadDocuments
);

router.post(
  "/:id/submit",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.submitVehicle
);

router.patch(
  "/:id/pause",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.pauseVehicle
);

router.patch(
  "/:id/resume",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.resumeVehicle
);

router.delete(
  "/:id",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.deleteVehicle
);

router.post(
  "/:id/unavailability",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  validate({ body: unavailabilitySchema }),
  vehicleController.addUnavailability
);

router.get(
  "/:id/unavailability",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.getUnavailability
);

router.delete(
  "/:id/unavailability/:blockId",
  verifyJWT,
  requireActiveAccount,
  authorizeRoles(ROLES.AGENT, ROLES.INDIVIDUAL),
  vehicleController.removeUnavailability
);

export default router;

