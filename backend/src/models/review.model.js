import mongoose from "mongoose";
import { REVIEW_DIRECTIONS } from "../constants.js";

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: Object.values(REVIEW_DIRECTIONS),
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique on booking + direction (one review per direction per booking)
reviewSchema.index({ booking: 1, direction: 1 }, { unique: true });
reviewSchema.index({ vehicle: 1, isHidden: 1, createdAt: -1 });
reviewSchema.index({ reviewee: 1, direction: 1, isHidden: 1 });

export const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;

