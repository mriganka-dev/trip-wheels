import { Router } from "express";
import mongoose from "mongoose";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import publisherRoutes from "./publisher.routes.js";
import userRoutes from "./user.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

router.get("/health", (req, res) => {
  const connectionStates = [
    "disconnected",
    "connected",
    "connecting",
    "disconnecting",
  ];

  const dbState = connectionStates[mongoose.connection.readyState] || "unknown";
  const isDbConnected = mongoose.connection.readyState === 1;

  const data = {
    status: isDbConnected ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      state: dbState,
    },
  };

  res
    .status(200)
    .json(new ApiResponse(200, data, "Trip Wheels API is healthy"));
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/publishers", publisherRoutes);
router.use("/admin", adminRoutes);

export default router;
