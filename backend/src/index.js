import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./db/index.js";
import { startJobs, stopJobs } from "./jobs/index.js";

let server;

const startServer = async () => {
  await connectDB();

  startJobs();

  server = app.listen(env.PORT, () => {
    console.log(
      `Trip Wheels server running on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
  });
};

const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully`);

  stopJobs();

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed");
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
