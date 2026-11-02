import mongoose from "mongoose";
import { ROLES, VERIFICATION_STATUS } from "../constants.js";

const publisherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    publisherType: {
      type: String,
      enum: [ROLES.AGENT, ROLES.INDIVIDUAL],
      required: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: "",
    },
    businessAddress: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      default: "",
    },
    agentPickup: {
      address: {
        type: String,
        trim: true,
        default: "",
      },
      landmark: {
        type: String,
        trim: true,
        default: "",
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },
    individualArea: {
      city: {
        type: String,
        trim: true,
        default: "",
      },
      area: {
        type: String,
        trim: true,
        default: "",
      },
      approxLocation: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: undefined,
        },
      },
    },
    destination: {
      type: String,
      trim: true,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.NOT_SUBMITTED,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verificationCall: {
      done: {
        type: Boolean,
        default: false,
      },
      doneAt: {
        type: Date,
        default: null,
      },
      doneBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      notes: {
        type: String,
        default: "",
      },
    },
    selfieWithId: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    notificationsTestConfirmedAt: {
      type: Date,
      default: null,
    },
    flags: [
      {
        type: {
          type: String,
          required: true,
        },
        note: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        resolved: {
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
    ],
    reliability: {
      score: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      requestsReceived: {
        type: Number,
        default: 0,
      },
      accepted: {
        type: Number,
        default: 0,
      },
      rejected: {
        type: Number,
        default: 0,
      },
      expired: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      cancelledAfterConfirm: {
        type: Number,
        default: 0,
      },
      noShows: {
        type: Number,
        default: 0,
      },
      issuesUpheld: {
        type: Number,
        default: 0,
      },
      lateDisclosures: {
        type: Number,
        default: 0,
      },
      undisclosedUnavailability: {
        type: Number,
        default: 0,
      },
      missedConfirmations: {
        type: Number,
        default: 0,
      },
      avgResponseMinutes: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

publisherProfileSchema.index({ "agentPickup.location": "2dsphere" });

export const PublisherProfile = mongoose.model(
  "PublisherProfile",
  publisherProfileSchema
);

