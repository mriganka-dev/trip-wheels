import {
  BOOKING_STATUS,
  BUSINESS_DEFAULTS,
  NOTIFICATION_EVENTS,
  REVIEW_DIRECTIONS,
} from "../constants.js";
import { Booking } from "../models/booking.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { notify } from "../notifications/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";

export const recalculateRatingAggregates = async (review) => {
  // 1. Recalculate vehicle rating if vehicle is attached
  if (review.vehicle) {
    const stats = await Review.aggregate([
      {
        $match: {
          vehicle: review.vehicle,
          isHidden: false,
          direction: REVIEW_DIRECTIONS.CUSTOMER_TO_PUBLISHER,
        },
      },
      {
        $group: {
          _id: "$vehicle",
          avg: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingAvg = stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0;
    const ratingCount = stats.length > 0 ? stats[0].count : 0;

    await Vehicle.findByIdAndUpdate(review.vehicle, { ratingAvg, ratingCount });
  }

  // 2. Recalculate reviewee rating
  if (review.direction === REVIEW_DIRECTIONS.CUSTOMER_TO_PUBLISHER) {
    const pubStats = await Review.aggregate([
      {
        $match: {
          reviewee: review.reviewee,
          isHidden: false,
          direction: REVIEW_DIRECTIONS.CUSTOMER_TO_PUBLISHER,
        },
      },
      {
        $group: {
          _id: "$reviewee",
          avg: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingAvg =
      pubStats.length > 0 ? Math.round(pubStats[0].avg * 10) / 10 : 0;
    const ratingCount = pubStats.length > 0 ? pubStats[0].count : 0;

    await PublisherProfile.findOneAndUpdate(
      { user: review.reviewee },
      { ratingAvg, ratingCount }
    );
  } else if (review.direction === REVIEW_DIRECTIONS.PUBLISHER_TO_CUSTOMER) {
    const custStats = await Review.aggregate([
      {
        $match: {
          reviewee: review.reviewee,
          isHidden: false,
          direction: REVIEW_DIRECTIONS.PUBLISHER_TO_CUSTOMER,
        },
      },
      {
        $group: {
          _id: "$reviewee",
          avg: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingAvg =
      custStats.length > 0 ? Math.round(custStats[0].avg * 10) / 10 : 0;
    const ratingCount = custStats.length > 0 ? custStats[0].count : 0;

    await User.findByIdAndUpdate(review.reviewee, {
      "reliability.ratingAvg": ratingAvg,
      "reliability.ratingCount": ratingCount,
    });
  }
};

export const createReview = async (reviewerUser, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new ApiError(
      400,
      `Reviews can only be submitted for completed bookings (current status: '${booking.status}')`
    );
  }

  const completedAt =
    booking.completion?.completedAt || booking.updatedAt || booking.endAt;
  const daysPassed =
    (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24);

  if (daysPassed > BUSINESS_DEFAULTS.REVIEW_WINDOW_DAYS) {
    throw new ApiError(
      400,
      `Review window of ${BUSINESS_DEFAULTS.REVIEW_WINDOW_DAYS} days has expired`
    );
  }

  const reviewerId = reviewerUser._id.toString();
  const isCustomer = reviewerId === booking.customer.toString();
  const isPublisher = reviewerId === booking.publisher.toString();

  if (!isCustomer && !isPublisher) {
    throw new ApiError(
      403,
      "Only participants of this booking can leave a review"
    );
  }

  let direction;
  let reviewee;
  let vehicle = null;

  if (isCustomer) {
    direction = REVIEW_DIRECTIONS.CUSTOMER_TO_PUBLISHER;
    reviewee = booking.publisher;
    vehicle = booking.assignedVehicle || booking.vehicle;
  } else {
    direction = REVIEW_DIRECTIONS.PUBLISHER_TO_CUSTOMER;
    reviewee = booking.customer;
  }

  if (reviewerId === reviewee.toString()) {
    throw new ApiError(400, "Self-reviews are not allowed");
  }

  const existing = await Review.findOne({ booking: bookingId, direction });
  if (existing) {
    throw new ApiError(
      400,
      "You have already submitted a review for this booking"
    );
  }

  const review = await Review.create({
    booking: bookingId,
    direction,
    reviewer: reviewerUser._id,
    reviewee,
    vehicle,
    rating: data.rating,
    comment: data.comment || "",
    tags: data.tags || [],
    isHidden: false,
  });

  // Atomically update aggregate rating on vehicle and reviewee
  await recalculateRatingAggregates(review);

  // Notify reviewee
  notify({
    userId: reviewee,
    event: NOTIFICATION_EVENTS.REVIEW_RECEIVED,
    data: {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      rating: data.rating,
    },
  }).catch((err) => console.error("Notification error:", err));

  return review;
};

export const getVehicleReviews = async (vehicleId, query) => {
  const { page, limit, skip } = getPagination(query);

  const filter = {
    vehicle: vehicleId,
    isHidden: false,
    direction: REVIEW_DIRECTIONS.CUSTOMER_TO_PUBLISHER,
  };

  const totalItems = await Review.countDocuments(filter);
  const items = await Review.find(filter)
    .populate("reviewer", "fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const getPublisherReviews = async (publisherId, query) => {
  const { page, limit, skip } = getPagination(query);

  const filter = {
    reviewee: publisherId,
    isHidden: false,
    direction: REVIEW_DIRECTIONS.CUSTOMER_TO_PUBLISHER,
  };

  const totalItems = await Review.countDocuments(filter);
  const items = await Review.find(filter)
    .populate("reviewer", "fullName")
    .populate("vehicle", "brand model type")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const hideReview = async (adminUser, reviewId, isHidden) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.isHidden = Boolean(isHidden);
  await review.save();

  // Atomically update averages (so hidden reviews are excluded from averages)
  await recalculateRatingAggregates(review);

  return review;
};
