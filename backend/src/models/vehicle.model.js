import mongoose from "mongoose";
import {
  FUEL_TYPES,
  PICKUP_MODES,
  TRANSMISSION_TYPES,
  VEHICLE_STATUS,
  VEHICLE_TYPES,
} from "../constants.js";

const vehicleSchema = new mongoose.Schema(
  {
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    publisherProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublisherProfile",
      required: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(VEHICLE_TYPES),
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    transmission: {
      type: String,
      enum: Object.values(TRANSMISSION_TYPES),
      required: true,
    },
    fuelType: {
      type: String,
      enum: Object.values(FUEL_TYPES),
      required: true,
    },
    seats: {
      type: Number,
      default: null,
    },
    engineCc: {
      type: Number,
      default: null,
    },
    mileage: {
      type: String,
      trim: true,
      default: "",
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    pricing: {
      perDay: {
        type: Number,
        required: true,
        min: 0,
      },
      perHour: {
        type: Number,
        default: null,
      },
      deposit: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    minRentalHours: {
      type: Number,
      default: 4,
    },
    documentsRequiredAtPickup: {
      type: [String],
      default: ["Government ID", "Driving License"],
    },
    cancellationPolicy: {
      freeCancellationHoursBeforePickup: {
        type: Number,
        default: 24,
      },
      notes: {
        type: String,
        trim: true,
        default: "",
      },
    },
    pickup: {
      mode: {
        type: String,
        enum: Object.values(PICKUP_MODES),
        required: true,
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
          default: undefined,
        },
      },
      approximateArea: {
        type: String,
        trim: true,
        default: "",
      },
    },
    chassisNumber: {
      type: String,
      trim: true,
      select: false,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      select: false,
    },
    rc: {
      file: {
        url: {
          type: String,
          default: "",
        },
        publicId: {
          type: String,
          default: "",
        },
      },
      ownerName: {
        type: String,
        trim: true,
        default: "",
      },
      registrationNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },
    },
    insurance: {
      file: {
        url: {
          type: String,
          default: "",
        },
        publicId: {
          type: String,
          default: "",
        },
      },
      policyNumber: {
        type: String,
        trim: true,
        default: "",
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },
    noc: {
      file: {
        url: {
          type: String,
          default: "",
        },
        publicId: {
          type: String,
          default: "",
        },
      },
    },
    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.DRAFT,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    ratingAvg: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    tripsCompleted: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ destination: 1, type: 1, status: 1 });
vehicleSchema.index({ "pricing.perDay": 1 });
vehicleSchema.index({ "pickup.location": "2dsphere" });

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
