import mongoose from "mongoose";
import { NOTIFICATION_CHANNELS } from "../constants.js";

const channelDeliverySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      required: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    channels: [channelDeliverySchema],
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, readAt: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
