import crypto from "crypto";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { normalizePhone } from "../utils/phone.js";

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userObj = user.toObject();

  // Defensively attach publisher profile if Plan 3 model is registered
  if (mongoose.models.PublisherProfile) {
    const publisherProfile = await mongoose.models.PublisherProfile.findOne({
      user: userId,
    });
    userObj.publisherProfile = publisherProfile || null;
  }

  return userObj;
};

export const updateProfile = async (userId, { fullName, phone }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (fullName !== undefined) {
    user.fullName = fullName.trim();
  }

  if (phone !== undefined) {
    const normalizedPhoneNumber = normalizePhone(phone);
    if (normalizedPhoneNumber !== user.phone) {
      const existing = await User.findOne({
        phone: normalizedPhoneNumber,
        _id: { $ne: userId },
      });

      if (existing) {
        throw new ApiError(409, "Phone number is already in use");
      }

      user.phone = normalizedPhoneNumber;
      user.phoneConfirmedByAdmin = false;
      user.phoneConfirmedAt = null;
      user.phoneConfirmedBy = null;
    }
  }

  await user.save();
  return await User.findById(userId).select("-password -refreshToken");
};

export const updateAvatar = async (userId, localFilePath) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const uploadResult = await uploadOnCloudinary(
    localFilePath,
    "trip_wheels/avatars"
  );
  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  if (user.avatar?.publicId) {
    try {
      await deleteFromCloudinary(user.avatar.publicId);
    } catch (err) {
      console.error(
        "Failed to delete previous avatar from Cloudinary:",
        err.message
      );
    }
  }

  user.avatar = {
    url: uploadResult.url,
    publicId: uploadResult.publicId,
  };

  await user.save();
  return await User.findById(userId).select("-password -refreshToken");
};

export const updateNotificationPreferences = async (
  userId,
  preferences = {}
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.notificationPreferences = {
    email:
      preferences.email !== undefined
        ? Boolean(preferences.email)
        : user.notificationPreferences.email,
    push:
      preferences.push !== undefined
        ? Boolean(preferences.push)
        : user.notificationPreferences.push,
    inApp:
      preferences.inApp !== undefined
        ? Boolean(preferences.inApp)
        : user.notificationPreferences.inApp,
  };

  await user.save();
  return await User.findById(userId).select("-password -refreshToken");
};

export const anonymizeUser = async (userId, actorId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (mongoose.models.Booking) {
    const activeBooking = await mongoose.models.Booking.findOne({
      $or: [{ customer: userId }, { publisher: userId }],
      status: { $in: ["requested", "confirmed", "ongoing"] },
    });
    if (activeBooking) {
      throw new ApiError(
        400,
        "Cannot anonymize account while there are active or ongoing bookings"
      );
    }
  }

  const anonymizedSuffix = user._id.toString().slice(-8);
  user.fullName = "Anonymous User";
  user.email = `deleted_${anonymizedSuffix}@deleted.local`;
  user.phone = `910000${anonymizedSuffix}`;
  user.password = crypto.randomUUID();
  user.refreshToken = null;
  user.accountStatus = "suspended";
  user.isEmailVerified = false;
  user.avatar = { url: "", publicId: "" };

  await user.save();

  if (mongoose.models.PublisherProfile) {
    await mongoose.models.PublisherProfile.findOneAndUpdate(
      { user: userId },
      { businessName: "Deleted Business", verificationStatus: "suspended" }
    );
  }

  return {
    anonymized: true,
    message:
      "User personal data has been anonymized. Historical booking records remain for auditing. KYC documents are retained according to statutory requirements.",
  };
};
