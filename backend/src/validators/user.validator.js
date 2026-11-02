import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
      .optional(),
    phone: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must not exceed 15 digits")
      .optional(),
  })
  .refine((data) => data.fullName !== undefined || data.phone !== undefined, {
    message: "At least one of fullName or phone must be provided",
  });

export const updateNotificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
});

