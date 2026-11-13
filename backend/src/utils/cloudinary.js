import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to delete temp file ${filePath}:`, error.message);
    }
  }
};

export const uploadOnCloudinary = async (
  localFilePath,
  folder = "trip_wheels"
) => {
  if (!localFilePath) {
    return null;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "auto",
    });

    cleanupTempFile(localFilePath);
    return {
      url: response.secure_url,
      publicId: response.public_id,
    };
  } catch (error) {
    cleanupTempFile(localFilePath);
    console.error("Cloudinary upload failed:", error.message);
    throw error;
  }
};

export const uploadPrivateOnCloudinary = async (
  localFilePath,
  folder = "trip_wheels/private"
) => {
  if (!localFilePath) {
    return null;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder,
      type: "authenticated",
      resource_type: "auto",
    });

    cleanupTempFile(localFilePath);
    return {
      url: response.secure_url,
      publicId: response.public_id,
    };
  } catch (error) {
    cleanupTempFile(localFilePath);
    console.error("Cloudinary private upload failed:", error.message);
    throw error;
  }
};

export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image"
) => {
  if (!publicId) {
    return null;
  }

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
    throw error;
  }
};

export const generateSignedCloudinaryUrl = (
  publicId,
  expiresInSeconds = 300
) => {
  if (!publicId) {
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.utils.private_download_url(publicId, "", {
    expires_at: expiresAt,
  });
};
