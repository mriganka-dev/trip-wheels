import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ACCOUNT_STATUS, BUSINESS_DEFAULTS, ROLES } from "../constants.js";
import { EmailOtp } from "../models/emailOtp.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { generateOtp } from "../utils/generateOtp.js";
import { normalizePhone } from "../utils/phone.js";
import { sendOtpEmail } from "./email.service.js";

const hashOtp = (code) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

export const createAndSendOtp = async (email, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limit per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const otpsSentInPastHour = await EmailOtp.countDocuments({
    email: normalizedEmail,
    purpose,
    createdAt: { $gte: oneHourAgo },
  });

  if (otpsSentInPastHour >= BUSINESS_DEFAULTS.OTP_MAX_PER_HOUR) {
    throw new ApiError(
      429,
      "Too many OTP requests in the past hour. Please try again later."
    );
  }

  // Check resend cooldown
  const latestOtp = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose,
  }).sort({ createdAt: -1 });

  if (latestOtp) {
    const elapsedSeconds = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
    if (elapsedSeconds < BUSINESS_DEFAULTS.OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(
        BUSINESS_DEFAULTS.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds
      );
      throw new ApiError(
        429,
        `Please wait ${waitSeconds} seconds before requesting a new code.`
      );
    }
  }

  const code = generateOtp(6);
  const codeHash = hashOtp(code);
  const expiresAt = new Date(
    Date.now() + BUSINESS_DEFAULTS.OTP_EXPIRY_MINUTES * 60 * 1000
  );

  await EmailOtp.create({
    email: normalizedEmail,
    codeHash,
    purpose,
    expiresAt,
  });

  await sendOtpEmail(normalizedEmail, code, purpose);
  return { success: true };
};

export const verifyOtpCode = async (email, code, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();
  const codeHash = hashOtp(code);

  const otpRecord = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose,
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  if (otpRecord.attempts >= BUSINESS_DEFAULTS.OTP_MAX_ATTEMPTS) {
    throw new ApiError(
      400,
      "Maximum OTP attempts exceeded. Please request a new code."
    );
  }

  if (otpRecord.codeHash !== codeHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remainingAttempts =
      BUSINESS_DEFAULTS.OTP_MAX_ATTEMPTS - otpRecord.attempts;
    throw new ApiError(
      400,
      `Invalid OTP. ${remainingAttempts} attempts remaining.`
    );
  }

  otpRecord.usedAt = new Date();
  await otpRecord.save();

  return true;
};

export const register = async ({
  fullName,
  email,
  phone,
  password,
  role = ROLES.CUSTOMER,
}) => {
  if (role === ROLES.ADMIN) {
    throw new ApiError(403, "Admin registration is not allowed");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhoneNumber = normalizePhone(phone);

  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new ApiError(409, "User with this email already exists");
  }

  const existingPhone = await User.findOne({ phone: normalizedPhoneNumber });
  if (existingPhone) {
    throw new ApiError(409, "User with this phone number already exists");
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhoneNumber,
    password,
    role,
  });

  await createAndSendOtp(normalizedEmail, "verify_email");

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  return createdUser;
};

export const verifyEmail = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();
  await verifyOtpCode(normalizedEmail, otp, "verify_email");

  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { isEmailVerified: true } },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const login = async ({ emailOrPhone, password }) => {
  const identifier = emailOrPhone.trim();
  let query = {};

  if (identifier.includes("@")) {
    query = { email: identifier.toLowerCase() };
  } else {
    try {
      const normalized = normalizePhone(identifier);
      query = { phone: normalized };
    } catch {
      query = { phone: identifier };
    }
  }

  const user = await User.findOne(query).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid email/phone or password");
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(
      403,
      `Your account is suspended. Reason: ${user.suspendedReason || "Terms violation"}`
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email/phone or password");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  const userResponse = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded?._id).select("+refreshToken");
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, "Account is suspended");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or expired");
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 },
  });
  return true;
};

export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.accountStatus !== ACCOUNT_STATUS.SUSPENDED) {
    await createAndSendOtp(normalizedEmail, "reset_password");
  }

  // Consistent message whether or not user exists
  return {
    message:
      "If an account exists with that email, a password reset code has been sent.",
  };
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();
  await verifyOtpCode(normalizedEmail, otp, "reset_password");

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshToken"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();

  return true;
};

export const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return true;
};
