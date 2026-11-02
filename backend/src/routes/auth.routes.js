import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
  requireActiveAccount,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import {
  authLimiter,
  otpLimiter,
} from "../middlewares/rateLimit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  authController.register
);

router.post(
  "/verify-email",
  otpLimiter,
  validate({ body: verifyEmailSchema }),
  authController.verifyEmail
);

router.post(
  "/resend-otp",
  otpLimiter,
  validate({ body: resendOtpSchema }),
  authController.resendOtp
);

router.post(
  "/login",
  authLimiter,
  validate({ body: loginSchema }),
  authController.login
);

router.post(
  "/refresh-token",
  validate({ body: refreshTokenSchema }),
  authController.refreshAccessToken
);

router.post("/logout", verifyJWT, requireActiveAccount, authController.logout);

router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

router.post(
  "/change-password",
  verifyJWT,
  requireActiveAccount,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

export default router;
