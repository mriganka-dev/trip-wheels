import { z } from "zod";
import { BOOKING_STATUS, UNAVAILABILITY_REASONS } from "../constants.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z
  .string()
  .regex(objectIdRegex, "Invalid ObjectId format");

export const createBookingSchema = z
  .object({
    vehicleId: objectIdSchema,
    startAt: z
      .string()
      .datetime("startAt must be a valid ISO 8601 date string"),
    endAt: z.string().datetime("endAt must be a valid ISO 8601 date string"),
    customerNote: z
      .string()
      .max(500, "customerNote cannot exceed 500 characters")
      .optional(),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "endAt must be strictly after startAt",
    path: ["endAt"],
  });

export const acceptBookingSchema = z.object({
  chassisNumber: z.string().trim().optional(),
  registrationNumber: z.string().trim().optional(),
  color: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const rejectBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const finalizePickupPointSchema = z.object({
  address: z.string().trim().min(3, "Address must be at least 3 characters"),
  landmark: z.string().trim().optional(),
  coordinates: z
    .array(z.number())
    .length(2, "Coordinates must contain [longitude, latitude]"),
  note: z.string().trim().max(500).optional(),
});

export const confirmVehicleSchema = z.object({
  chassisNumber: z
    .string()
    .trim()
    .min(3, "Chassis number must be at least 3 characters"),
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Registration number must be at least 3 characters"),
  color: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  assignedVehicleId: objectIdSchema.optional(),
});

export const reportVehicleUnavailableSchema = z.object({
  reason: z.enum(Object.values(UNAVAILABILITY_REASONS), {
    errorMap: () => ({
      message: `reason must be one of: ${Object.values(UNAVAILABILITY_REASONS).join(", ")}`,
    }),
  }),
  note: z.string().trim().max(500).optional(),
});

export const confirmPickupReadySchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const handoverSchema = z.object({
  customerIdVerified: z.literal(true, {
    errorMap: () => ({ message: "customerIdVerified must be true" }),
  }),
  licenseVerified: z.literal(true, {
    errorMap: () => ({ message: "licenseVerified must be true" }),
  }),
});

export const declineHandoverSchema = z.object({
  reason: z.enum(["invalid_id", "invalid_license", "name_mismatch", "other"], {
    errorMap: () => ({
      message:
        "reason must be invalid_id, invalid_license, name_mismatch, or other",
    }),
  }),
  note: z.string().trim().max(500).optional(),
});

export const completeBookingSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const createModificationRequestSchema = z
  .object({
    newStartAt: z
      .string()
      .datetime("newStartAt must be a valid ISO 8601 date string"),
    newEndAt: z
      .string()
      .datetime("newEndAt must be a valid ISO 8601 date string"),
  })
  .refine((data) => new Date(data.newEndAt) > new Date(data.newStartAt), {
    message: "newEndAt must be strictly after newStartAt",
    path: ["newEndAt"],
  });

export const decideModificationRequestSchema = z.object({
  action: z.enum(["accept", "reject"], {
    errorMap: () => ({ message: "action must be either 'accept' or 'reject'" }),
  }),
});

export const adminOverrideBookingStatusSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS), {
    errorMap: () => ({
      message: `status must be one of: ${Object.values(BOOKING_STATUS).join(", ")}`,
    }),
  }),
  note: z
    .string()
    .trim()
    .min(5, "A mandatory audit note of at least 5 characters is required"),
});

export const bookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
});

export const adminBookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
  destinationId: objectIdSchema.optional(),
  publisherId: objectIdSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
