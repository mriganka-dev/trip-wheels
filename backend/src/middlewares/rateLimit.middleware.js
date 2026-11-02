import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

const createLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new ApiError(429, message));
    },
  });
};

export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts, please try again later",
});

export const otpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many OTP attempts, please try again later",
});

export const bookingCreateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many booking requests created, please try again later",
});

