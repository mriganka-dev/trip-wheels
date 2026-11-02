import * as reviewService from "../services/review.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, review, "Review submitted successfully"));
});

export const getVehicleReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getVehicleReviews(
    req.params.id,
    req.query
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Vehicle reviews fetched successfully"));
});

export const getPublisherReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getPublisherReviews(
    req.params.id,
    req.query
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Publisher reviews fetched successfully")
    );
});

export const hideReview = asyncHandler(async (req, res) => {
  const review = await reviewService.hideReview(
    req.user,
    req.params.id,
    req.body.isHidden
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        review,
        `Review visibility updated to ${req.body.isHidden ? "hidden" : "visible"}`
      )
    );
});

