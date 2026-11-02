import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    RESPONSE_WINDOW_HOURS: z.coerce.number().int().min(1).max(48).optional(),
    MIN_BOOKING_LEAD_HOURS: z.coerce.number().int().min(1).max(72).optional(),
    MAX_ACTIVE_REQUESTS_PER_CUSTOMER: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .optional(),
    VEHICLE_CONFIRMATION_LEAD_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(72)
      .optional(),
    VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: z
      .array(z.coerce.number().int().min(1))
      .optional(),
    VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: z.coerce
      .number()
      .int()
      .min(1)
      .max(48)
      .optional(),
    LATE_DISCLOSURE_HOURS: z.coerce.number().int().min(1).max(72).optional(),
    PRE_PICKUP_REMINDER_HOURS_BEFORE: z.coerce
      .number()
      .int()
      .min(1)
      .max(24)
      .optional(),
    NO_SHOW_GRACE_MINUTES: z.coerce.number().int().min(15).max(360).optional(),
    AUTO_COMPLETE_GRACE_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(48)
      .optional(),
    INDIVIDUAL_MAX_VEHICLES: z.coerce.number().int().min(1).max(10).optional(),
    OTP_EXPIRY_MINUTES: z.coerce.number().int().min(1).max(60).optional(),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).optional(),
    OTP_RESEND_COOLDOWN_SECONDS: z.coerce
      .number()
      .int()
      .min(10)
      .max(300)
      .optional(),
    OTP_MAX_PER_HOUR: z.coerce.number().int().min(1).max(20).optional(),
    REVIEW_WINDOW_DAYS: z.coerce.number().int().min(1).max(90).optional(),
    ISSUE_WINDOW_DAYS_AFTER_COMPLETION: z.coerce
      .number()
      .int()
      .min(1)
      .max(90)
      .optional(),
    INSURANCE_EXPIRY_WARNING_DAYS: z
      .array(z.coerce.number().int().min(1))
      .optional(),
  })
  .strict();

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  actor: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
