import { z } from "zod";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const passwordMessage =
  "Password must be at least 8 characters long and contain at least one letter and one number";

const phoneRegex = /^[6-9]\d{9}$/;
const phoneMessage = "Enter a valid 10 digit Indian mobile number starting with 6, 7, 8 or 9";

export const registerFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters"),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    phone: z.string().trim().regex(phoneRegex, phoneMessage),
    password: z.string().regex(passwordRegex, passwordMessage),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  emailOrPhone: z.string().trim().min(3, "Email or 10 digit phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const verifyEmailFormSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  otp: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only numbers"),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    otp: z
      .string()
      .trim()
      .length(6, "Verification code must be exactly 6 digits")
      .regex(/^\d{6}$/, "Code must contain only numbers"),
    newPassword: z.string().regex(passwordRegex, passwordMessage),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

