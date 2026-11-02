import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ACCOUNT_STATUS } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request: token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Unauthorized request: invalid or expired token");
  }

  const user = await User.findById(decoded?._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized request: user no longer exists");
  }

  req.user = user;
  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "Forbidden: you do not have permission to access this resource"
        )
      );
    }

    next();
  };
};

export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    return next(
      new ApiError(
        403,
        `Your account has been suspended. Reason: ${req.user.suspendedReason || "Terms violation"}`
      )
    );
  }

  next();
};

export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!req.user.isEmailVerified) {
    return next(
      new ApiError(403, "Email verification required to perform this action")
    );
  }

  next();
};
