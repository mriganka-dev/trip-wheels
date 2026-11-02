import { connectDB, disconnectDB } from "../src/db/index.js";
import "../src/models/user.model.js";
import "../src/models/publisherProfile.model.js";
import "../src/models/verificationDocument.model.js";
import "../src/models/destination.model.js";
import "../src/models/vehicle.model.js";
import "../src/models/vehicleUnavailability.model.js";
import "../src/models/booking.model.js";
import "../src/models/counter.model.js";
import "../src/models/notification.model.js";
import "../src/models/pushSubscription.model.js";
import "../src/models/emailOtp.model.js";
import "../src/models/review.model.js";
import "../src/models/issue.model.js";
import "../src/models/adminTask.model.js";
import "../src/models/auditLog.model.js";
import "../src/models/setting.model.js";
import mongoose from "mongoose";

const syncIndexes = async () => {
  console.log("Starting database index synchronization...");

  try {
    await connectDB();

    const modelNames = Object.keys(mongoose.models);
    console.log(`Found ${modelNames.length} registered models.`);

    for (const name of modelNames) {
      const model = mongoose.models[name];
      try {
        await model.syncIndexes();
        console.log(`Synchronized indexes for model: ${name}`);
      } catch (err) {
        console.error(
          `Failed to sync indexes for model ${name}: ${err.message}`
        );
      }
    }

    console.log("Index synchronization complete.");
  } catch (error) {
    console.error("Index sync fatal error:", error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

syncIndexes();
