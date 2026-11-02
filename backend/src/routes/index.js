import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import mongoose from "mongoose";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import bookingRoutes from "./booking.routes.js";
import destinationRoutes from "./destination.routes.js";
import issueRoutes from "./issue.routes.js";
import notificationRoutes from "./notification.routes.js";
import publisherRoutes from "./publisher.routes.js";
import userRoutes from "./user.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.resolve(__dirname, "../../docs/openapi.json");

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

router.get("/ready", (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;

  if (!isDbReady) {
    return res.status(503).json({
      statusCode: 503,
      data: {
        status: "not_ready",
        database: {
          connected: false,
          readyState: mongoose.connection.readyState,
        },
      },
      message: "Service not ready: database disconnected",
      success: false,
    });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "ready",
        database: { connected: true, readyState: 1 },
      },
      "Trip Wheels API is ready to accept traffic"
    )
  );
});

router.get("/docs.json", (req, res) => {
  try {
    const rawSpec = fs.readFileSync(openApiPath, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(rawSpec);
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      data: null,
      message: "OpenAPI specification document not found",
      success: false,
    });
  }
});

router.get("/docs", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Trip Wheels API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background-color: #fafafa; font-family: sans-serif; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/publishers", publisherRoutes);
router.use("/destinations", destinationRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/bookings", bookingRoutes);
router.use("/issues", issueRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
