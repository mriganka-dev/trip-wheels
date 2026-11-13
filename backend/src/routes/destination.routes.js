import { Router } from "express";
import * as destinationController from "../controllers/destination.controller.js";

const router = Router();

router.get("/", destinationController.getActiveDestinations);

export default router;
