import mongoose from "mongoose";
import { ADMIN_TASK_STATUS, ADMIN_TASK_TYPES } from "../constants.js";

const adminTaskSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(ADMIN_TASK_TYPES),
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ADMIN_TASK_STATUS),
      default: ADMIN_TASK_STATUS.OPEN,
      index: true,
    },
    note: {
      type: String,
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dueAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminTask = mongoose.model("AdminTask", adminTaskSchema);

