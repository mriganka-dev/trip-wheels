import * as userService from "../services/user.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userService.getCurrentUser(req.user._id);
  res.status(200).json(new ApiResponse(200, user, "Current user fetched"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateProfile(req.user._id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image file is required");
  }

  const updatedUser = await userService.updateAvatar(
    req.user._id,
    avatarLocalPath
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateNotificationPreferences(
    req.user._id,
    req.body
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "Notification preferences updated successfully"
      )
    );
});

export const anonymizeMe = asyncHandler(async (req, res) => {
  const result = await userService.anonymizeUser(req.user._id, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Account anonymized successfully"));
});
