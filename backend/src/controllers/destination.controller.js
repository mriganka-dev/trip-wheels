import * as destinationService from "../services/destination.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getActiveDestinations = asyncHandler(async (req, res) => {
  const destinations = await destinationService.getActiveDestinations();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        destinations,
        "Active destinations fetched successfully"
      )
    );
});

export const createDestination = asyncHandler(async (req, res) => {
  const destination = await destinationService.createDestination(req.body);
  res
    .status(201)
    .json(
      new ApiResponse(201, destination, "Destination created successfully")
    );
});

export const updateDestination = asyncHandler(async (req, res) => {
  const destination = await destinationService.updateDestination(
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, destination, "Destination updated successfully")
    );
});

export const getAllDestinations = asyncHandler(async (req, res) => {
  const result = await destinationService.getAllDestinations(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "All destinations fetched"));
});
