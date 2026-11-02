import fs from "fs";
import path from "path";
import {
  ADMIN_TASK_TYPES,
  BOOKING_STATUS,
  NOTIFICATION_EVENTS,
  VEHICLE_STATUS,
} from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { Booking } from "../models/booking.model.js";
import { EmailOtp } from "../models/emailOtp.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { notify } from "../notifications/notification.service.js";
import { getSetting } from "../services/config.service.js";

export const insuranceExpiryJob = async () => {
  const now = new Date();
  const warningDaysList = (await getSetting(
    "INSURANCE_EXPIRY_WARNING_DAYS"
  )) || [30, 7, 1];

  // 1. Send warning notifications to publishers for 30, 7, 1 days before expiry
  for (const days of warningDaysList) {
    const startWindow = new Date(
      now.getTime() + (days - 1) * 24 * 60 * 60 * 1000
    );
    const endWindow = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const vehiclesToWarn = await Vehicle.find({
      status: VEHICLE_STATUS.ACTIVE,
      "insurance.expiresAt": { $gte: startWindow, $lte: endWindow },
      isDeleted: false,
    });

    for (const v of vehiclesToWarn) {
      notify({
        userId: v.publisher,
        event: NOTIFICATION_EVENTS.VEHICLE_INSURANCE_EXPIRING,
        data: {
          vehicleId: v._id,
          vehicleName: `${v.brand} ${v.model}`,
          daysRemaining: days,
        },
      }).catch((err) =>
        console.error("Insurance warning notification error:", err)
      );
    }
  }

  // 2. Auto-pause vehicles whose insurance has expired
  const expiredVehicles = await Vehicle.find({
    status: VEHICLE_STATUS.ACTIVE,
    "insurance.expiresAt": { $lt: now },
    isDeleted: false,
  });

  for (const v of expiredVehicles) {
    v.status = VEHICLE_STATUS.PAUSED;
    await v.save();

    // Check for any upcoming confirmed bookings for this vehicle
    const upcomingBookings = await Booking.find({
      $or: [{ vehicle: v._id }, { assignedVehicle: v._id }],
      status: BOOKING_STATUS.CONFIRMED,
      startAt: { $gte: now },
    });

    if (upcomingBookings.length > 0) {
      for (const b of upcomingBookings) {
        await AdminTask.create({
          type: ADMIN_TASK_TYPES.REVIEW_FLAG,
          booking: b._id,
          publisher: v.publisher,
          details: {
            reason: `Vehicle ${v.brand} ${v.model} (${v.registrationNumber}) auto-paused due to expired insurance, but has upcoming confirmed booking ${b.bookingCode}`,
            bookingCode: b.bookingCode,
          },
        });
      }
    }
  }
};

export const staleCleanupJob = async () => {
  const now = new Date();

  // 1. Clean up expired OTPs from DB
  try {
    await EmailOtp.deleteMany({ expiresAt: { $lt: now } });
  } catch (err) {
    console.error("Error cleaning up expired OTPs:", err);
  }

  // 2. Clean up orphaned temp files older than 24 hours
  try {
    const tempDir = path.resolve("public/temp");
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file === ".gitkeep") continue;
        const filePath = path.join(tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs < oneDayAgo) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          // Ignore individual file removal errors
        }
      }
    }
  } catch (err) {
    console.error("Error cleaning up stale temp files:", err);
  }
};
