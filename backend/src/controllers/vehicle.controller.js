import * as vehicleService from "../services/vehicle.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(
    req.user,
    req.publisherProfile,
    req.body
  );
  res
    .status(201)
    .json(new ApiResponse(201, vehicle, "Vehicle draft created successfully"));
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(
    req.params.id,
    req.user._id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle updated successfully"));
});

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  const vehicle = await vehicleService.uploadVehicleImages(
    req.params.id,
    req.user._id,
    files
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, vehicle, "Vehicle images uploaded successfully")
    );
});

export const deleteImage = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.deleteVehicleImage(
    req.params.id,
    req.params.imageId,
    req.user._id
  );

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle image removed successfully"));
});

export const uploadDocuments = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.uploadVehicleDocuments(
    req.params.id,
    req.user._id,
    req.files || {},
    req.body
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        vehicle,
        "Vehicle documents and registration details updated"
      )
    );
});

export const submitVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.submitVehicle(
    req.params.id,
    req.user._id
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, vehicle, "Vehicle submitted for review successfully")
    );
});

export const pauseVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.pauseVehicle(
    req.params.id,
    req.user._id
  );

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle paused successfully"));
});

export const resumeVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.resumeVehicle(
    req.params.id,
    req.user._id
  );

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle resumed successfully"));
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  await vehicleService.softDeleteVehicle(req.params.id, req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Vehicle deleted successfully"));
});

export const getMyVehicles = asyncHandler(async (req, res) => {
  const result = await vehicleService.getMyVehicles(req.user._id, req.query);

  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Publisher vehicles fetched successfully")
    );
});

export const addUnavailability = asyncHandler(async (req, res) => {
  const block = await vehicleService.addUnavailability(
    req.params.id,
    req.user._id,
    req.body
  );

  res
    .status(201)
    .json(
      new ApiResponse(201, block, "Unavailability period blocked successfully")
    );
});

export const getUnavailability = asyncHandler(async (req, res) => {
  const blocks = await vehicleService.getUnavailability(
    req.params.id,
    req.user._id
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, blocks, "Unavailability blocks fetched successfully")
    );
});

export const removeUnavailability = asyncHandler(async (req, res) => {
  await vehicleService.removeUnavailability(
    req.params.id,
    req.params.blockId,
    req.user._id
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Unavailability block removed successfully")
    );
});

export const searchVehicles = asyncHandler(async (req, res) => {
  const result = await vehicleService.searchVehicles(req.query);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Available vehicles search completed"));
});

export const getPublicVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getPublicVehicle(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, vehicle, "Vehicle details fetched"));
});

export const checkAvailability = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await vehicleService.checkAvailability(
    req.params.id,
    from,
    to
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Availability status retrieved"));
});
