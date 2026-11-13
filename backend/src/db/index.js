import dns from "dns";
import mongoose from "mongoose";
import { env } from "../config/env.js";

// Use public reliable DNS servers to avoid ISP SRV lookup failures on Windows / local routers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  // Fallback to system default if setting servers fails
}

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.DB_NAME,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `MongoDB connected: ${connectionInstance.connection.host}/${connectionInstance.connection.name}`
    );
    return connectionInstance;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected cleanly");
  } catch (error) {
    console.error("Error during MongoDB disconnect:", error.message);
  }
};
