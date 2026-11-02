import mongoose from "mongoose";
import {
  ISSUE_RESOLUTION_OUTCOMES,
  ISSUE_SEVERITY,
  ISSUE_STATUS,
  ISSUE_TYPES,
} from "../constants.js";

const evidenceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    raisedAgainst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ISSUE_TYPES),
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: Object.values(ISSUE_SEVERITY),
      default: ISSUE_SEVERITY.MEDIUM,
      index: true,
    },
    evidence: {
      type: [evidenceSchema],
      validate: [
        (val) => val.length <= 6,
        "Cannot attach more than 6 evidence images",
      ],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(ISSUE_STATUS),
      default: ISSUE_STATUS.OPEN,
      index: true,
    },
    response: {
      text: {
        type: String,
        trim: true,
        default: "",
      },
      at: {
        type: Date,
        default: null,
      },
    },
    resolution: {
      outcome: {
        type: String,
        enum: [...Object.values(ISSUE_RESOLUTION_OUTCOMES), null],
        default: null,
      },
      adminNote: {
        type: String,
        trim: true,
        default: "",
      },
      penaltyApplied: {
        type: Boolean,
        default: false,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
    },
    timeline: [timelineSchema],
  },
  {
    timestamps: true,
  }
);

issueSchema.index({ booking: 1, status: 1 });
issueSchema.index({ raisedBy: 1, status: 1 });
issueSchema.index({ raisedAgainst: 1, status: 1 });

export const Issue =
  mongoose.models.Issue || mongoose.model("Issue", issueSchema);

export default Issue;

