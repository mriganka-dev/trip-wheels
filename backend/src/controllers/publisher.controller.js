import * as publisherService from "../services/publisher.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await publisherService.upsertProfile(req.user, req.body);
  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Publisher profile updated successfully")
    );
});

export const getOwnProfile = asyncHandler(async (req, res) => {
  const profile = await publisherService.getOwnProfile(req.user._id);
  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Publisher profile fetched successfully")
    );
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Document file is required");
  }

  const { type, documentNumber } = req.body;
  const document = await publisherService.uploadKycDocument(
    req.user._id,
    file.path,
    { type, documentNumber }
  );

  res
    .status(201)
    .json(new ApiResponse(201, document, "Document uploaded successfully"));
});

export const getOwnDocuments = asyncHandler(async (req, res) => {
  const documents = await publisherService.getOwnDocuments(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, documents, "Documents fetched successfully"));
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await publisherService.deleteKycDocument(req.user._id, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Document deleted successfully"));
});

export const uploadSelfie = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Selfie image is required");
  }

  const profile = await publisherService.uploadSelfie(req.user, file.path);
  res
    .status(200)
    .json(new ApiResponse(200, profile, "Selfie uploaded successfully"));
});

export const submitVerification = asyncHandler(async (req, res) => {
  const profile = await publisherService.submitVerification(req.user);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        "Verification submitted successfully. An Admin will review your application."
      )
    );
});
