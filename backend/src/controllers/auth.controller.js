import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { attachSessionCookies, getCookieOptions } from "../utils/session.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user,
        "User registered successfully. Please verify your email with the OTP sent."
      )
    );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Email verified successfully"));
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  await authService.createAndSendOtp(email, purpose);
  res
    .status(200)
    .json(
      new ApiResponse(200, null, "New verification code sent to your email")
    );
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  attachSessionCookies(res, { accessToken, refreshToken });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        accessToken,
        refreshToken,
      },
      "Login successful"
    )
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  const { accessToken, refreshToken } =
    await authService.refreshAccessToken(incomingRefreshToken);

  attachSessionCookies(res, { accessToken, refreshToken });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
        refreshToken,
      },
      "Access token refreshed successfully"
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);

  const cookieOptions = getCookieOptions();

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);

  const cookieOptions = getCookieOptions();

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successful. Please log in with your new password."
      )
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});
