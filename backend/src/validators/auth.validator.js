import { z } from "zod";
import { ROLES } from "../constants.js";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const passwordMessage =
  "Password must be at least 8 characters long and contain at least one letter and one number";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  password: z.string().regex(passwordRegex, passwordMessage),
  role: z
    .enum([ROLES.CUSTOMER, ROLES.AGENT, ROLES.INDIVIDUAL])
    .optional()
    .default(ROLES.CUSTOMER),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  purpose: z.enum(["verify_email", "reset_password"]).default("verify_email"),
});

export const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(3, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
  newPassword: z.string().regex(passwordRegex, passwordMessage),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().regex(passwordRegex, passwordMessage),
});
