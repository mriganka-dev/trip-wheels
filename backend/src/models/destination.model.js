import mongoose from "mongoose";

const landmarkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["railway_station", "airport", "bus_stand", "other"],
      default: "other",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { _id: true }
);

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    nearbyDestinations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination",
      },
    ],
    landmarks: [landmarkSchema],
  },
  {
    timestamps: true,
  }
);

destinationSchema.index({ location: "2dsphere" });

export const Destination = mongoose.model("Destination", destinationSchema);

