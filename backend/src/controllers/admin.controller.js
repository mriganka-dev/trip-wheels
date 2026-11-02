import * as publisherService from "../services/publisher.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getVerifications = asyncHandler(async (req, res) => {
  const result = await publisherService.getVerificationQueue(req.query);
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Verification queue fetched successfully")
    );
});

export const getVerificationById = asyncHandler(async (req, res) => {
  const detail = await publisherService.getVerificationDetail(
    req.params.publisherId
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, detail, "Publisher verification details fetched")
    );
});

export const recordVerificationCall = asyncHandler(async (req, res) => {
  const profile = await publisherService.recordVerificationCall(
    req.params.publisherId,
    req.user._id,
    req.body
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Verification call recorded successfully")
    );
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const document = await publisherService.reviewDocument(
    req.params.docId,
    req.user._id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, document, "Document reviewed successfully"));
});

export const approveVerification = asyncHandler(async (req, res) => {
  const profile = await publisherService.approveVerification(
    req.params.publisherId,
    req.user._id
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Publisher profile approved successfully")
    );
});

export const rejectVerification = asyncHandler(async (req, res) => {
  const profile = await publisherService.rejectVerification(
    req.params.publisherId,
    req.user._id,
    req.body
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        "Publisher verification rejected successfully"
      )
    );
});

export const requestReverification = asyncHandler(async (req, res) => {
  const profile = await publisherService.requestReverification(
    req.params.publisherId,
    req.user._id,
    req.body
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, profile, "Reverification requested from publisher")
    );
});

export const confirmPhone = asyncHandler(async (req, res) => {
  const user = await publisherService.confirmUserPhone(
    req.params.userId,
    req.user._id
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "User phone confirmed successfully"));
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await publisherService.suspendUser(
    req.params.userId,
    req.body.reason
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "User suspended successfully"));
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await publisherService.unsuspendUser(req.params.userId);
  res
    .status(200)
    .json(new ApiResponse(200, user, "User unsuspended successfully"));
});
