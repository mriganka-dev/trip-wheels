import mongoose from "mongoose";
import { env } from "../config/env.js";

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
