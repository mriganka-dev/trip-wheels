import mongoose from "mongoose";
import { UNAVAILABILITY_REASONS } from "../constants.js";

const vehicleUnavailabilitySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      enum: Object.values(UNAVAILABILITY_REASONS),
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

vehicleUnavailabilitySchema.index({ vehicle: 1, from: 1, to: 1 });

export const VehicleUnavailability = mongoose.model(
  "VehicleUnavailability",
  vehicleUnavailabilitySchema
);

