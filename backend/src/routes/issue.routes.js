import { Router } from "express";
import * as issueController from "../controllers/issue.controller.js";
import {
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  issueListQuerySchema,
  respondIssueSchema,
} from "../validators/issue.validator.js";

const router = Router();

router.use(verifyJWT, requireActiveAccount);

router.get(
  "/mine",
  validate({ query: issueListQuerySchema }),
  issueController.getMyIssues
);

router.get("/:id", issueController.getIssueById);

router.post(
  "/:id/respond",
  validate({ body: respondIssueSchema }),
  issueController.respondToIssue
);

export default router;

