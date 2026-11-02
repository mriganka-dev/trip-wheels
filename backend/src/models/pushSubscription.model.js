import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
        trim: true,
      },
      auth: {
        type: String,
        required: true,
        trim: true,
      },
    },
    userAgent: {
      type: String,
      default: "",
    },
    platform: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    lastSuccessAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const PushSubscription = mongoose.model(
  "PushSubscription",
  pushSubscriptionSchema
);

