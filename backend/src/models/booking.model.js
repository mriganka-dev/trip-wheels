import mongoose from "mongoose";
import {
  BOOKING_STATUS,
  PICKUP_MODES,
  UNAVAILABILITY_REASONS,
} from "../constants.js";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const modificationRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    newStartAt: {
      type: Date,
      required: true,
    },
    newEndAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      default: function () {
        return this.vehicle;
      },
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    durationHours: {
      type: Number,
      required: true,
    },
    pricingSnapshot: {
      perDay: {
        type: Number,
        default: 0,
      },
      perHour: {
        type: Number,
        default: 0,
      },
      deposit: {
        type: Number,
        default: 0,
      },
      estimatedTotal: {
        type: Number,
        default: 0,
      },
      note: {
        type: String,
        default:
          "Informational. Paid directly to the agent or owner at pickup.",
      },
    },
    customerNote: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.REQUESTED,
      index: true,
    },
    statusHistory: [statusHistorySchema],
    responseDeadlineAt: {
      type: Date,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    remindersSent: {
      halfway: {
        type: Boolean,
        default: false,
      },
      final: {
        type: Boolean,
        default: false,
      },
      vehicleConfirmation: [
        {
          type: Date,
        },
      ],
      pickup: {
        type: Boolean,
        default: false,
      },
    },
    pickup: {
      mode: {
        type: String,
        enum: Object.values(PICKUP_MODES),
        default: PICKUP_MODES.FIXED,
      },
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
      finalizedAt: {
        type: Date,
        default: null,
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
    },
    vehicleConfirmation: {
      dueAt: {
        type: Date,
        default: null,
      },
      confirmedAt: {
        type: Date,
        default: null,
      },
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      chassisNumber: {
        type: String,
        trim: true,
        default: "",
      },
      registrationNumber: {
        type: String,
        trim: true,
        default: "",
      },
      color: {
        type: String,
        trim: true,
        default: "",
      },
      notes: {
        type: String,
        trim: true,
        default: "",
      },
      swappedFromVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        default: null,
      },
      missedAt: {
        type: Date,
        default: null,
      },
    },
    prePickupConfirmedAt: {
      type: Date,
      default: null,
    },
    handover: {
      customerIdVerified: {
        type: Boolean,
        default: false,
      },
      licenseVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      pickedUpAt: {
        type: Date,
        default: null,
      },
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      declined: {
        at: {
          type: Date,
          default: null,
        },
        reason: {
          type: String,
          trim: true,
          default: "",
        },
        note: {
          type: String,
          trim: true,
          default: "",
        },
      },
    },
    customerPickedUpAt: {
      type: Date,
      default: null,
    },
    completion: {
      completedAt: {
        type: Date,
        default: null,
      },
      completedBy: {
        type: String,
        enum: ["customer", "publisher", "system", null],
        default: null,
      },
      autoCompleted: {
        type: Boolean,
        default: false,
      },
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    hasOpenIssue: {
      type: Boolean,
      default: false,
    },
    cancellation: {
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      at: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        trim: true,
        default: "",
      },
      withinFreeWindow: {
        type: Boolean,
        default: false,
      },
    },
    unavailability: {
      reportedAt: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        enum: [...Object.values(UNAVAILABILITY_REASONS), ""],
        default: "",
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
      hoursBeforePickup: {
        type: Number,
        default: null,
      },
      lateDisclosure: {
        type: Boolean,
        default: false,
      },
    },
    modificationRequests: [modificationRequestSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ vehicle: 1, startAt: 1, endAt: 1, status: 1 });
bookingSchema.index({ assignedVehicle: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ publisher: 1, status: 1 });
bookingSchema.index({ responseDeadlineAt: 1 });
bookingSchema.index({ "vehicleConfirmation.dueAt": 1 });

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
