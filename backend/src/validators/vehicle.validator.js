import { z } from "zod";
import {
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  UNAVAILABILITY_REASONS,
  VEHICLE_TYPES,
} from "../constants.js";

export const createVehicleSchema = z.object({
  destination: z.string().min(1, "Destination ID is required"),
  type: z.enum(Object.values(VEHICLE_TYPES)),
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().optional().default(""),
  year: z.coerce
    .number()
    .int()
    .min(1990, "Year must be 1990 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().trim().optional().default(""),
  transmission: z.enum(Object.values(TRANSMISSION_TYPES)),
  fuelType: z.enum(Object.values(FUEL_TYPES)),
  seats: z.coerce.number().int().min(1).max(12).optional().nullable(),
  engineCc: z.coerce.number().int().min(50).max(5000).optional().nullable(),
  mileage: z.string().trim().optional().default(""),
  pricing: z.object({
    perDay: z.coerce.number().min(0, "Per-day price is required"),
    perHour: z.coerce.number().min(0).optional().nullable(),
    deposit: z.coerce.number().min(0).optional().default(0),
  }),
  minRentalHours: z.coerce.number().int().min(1).optional().default(4),
  cancellationPolicy: z
    .object({
      freeCancellationHoursBeforePickup: z.coerce
        .number()
        .int()
        .min(0)
        .optional()
        .default(24),
      notes: z.string().trim().optional().default(""),
    })
    .optional(),
});

export const updateVehicleSchema = z.object({
  type: z.enum(Object.values(VEHICLE_TYPES)).optional(),
  brand: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  variant: z.string().trim().optional(),
  year: z.coerce.number().int().min(1990).optional(),
  color: z.string().trim().optional(),
  transmission: z.enum(Object.values(TRANSMISSION_TYPES)).optional(),
  fuelType: z.enum(Object.values(FUEL_TYPES)).optional(),
  seats: z.coerce.number().int().min(1).max(12).optional().nullable(),
  engineCc: z.coerce.number().int().min(50).max(5000).optional().nullable(),
  mileage: z.string().trim().optional(),
  pricing: z
    .object({
      perDay: z.coerce.number().min(0).optional(),
      perHour: z.coerce.number().min(0).optional().nullable(),
      deposit: z.coerce.number().min(0).optional(),
    })
    .optional(),
  minRentalHours: z.coerce.number().int().min(1).optional(),
  cancellationPolicy: z
    .object({
      freeCancellationHoursBeforePickup: z.coerce
        .number()
        .int()
        .min(0)
        .optional(),
      notes: z.string().trim().optional(),
    })
    .optional(),
});

export const submitVehicleDocsSchema = z.object({
  chassisNumber: z.string().trim().min(3, "Chassis number is required"),
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Registration number is required"),
  rcOwnerName: z.string().trim().min(2, "RC owner name is required"),
  insurancePolicyNumber: z
    .string()
    .trim()
    .min(3, "Insurance policy number is required"),
  insuranceExpiresAt: z.coerce.date({
    message: "Valid insurance expiry date is required",
  }),
});

export const unavailabilitySchema = z.object({
  from: z.coerce.date({ message: "Start date is required" }),
  to: z.coerce.date({ message: "End date is required" }),
  reason: z.enum(Object.values(UNAVAILABILITY_REASONS)),
});

export const searchVehiclesSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  from: z.coerce.date({ message: "Start date is required" }),
  to: z.coerce.date({ message: "End date is required" }),
  type: z.enum(Object.values(VEHICLE_TYPES)).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  transmission: z.enum(Object.values(TRANSMISSION_TYPES)).optional(),
  fuelType: z.enum(Object.values(FUEL_TYPES)).optional(),
  ownerType: z.enum(["agent", "individual"]).optional(),
  nearLandmark: z.string().optional(),
  maxDistanceKm: z.coerce.number().min(0).optional().default(50),
  sort: z
    .enum(["price_asc", "price_desc", "rating", "distance", "reliability"])
    .optional()
    .default("price_asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const availabilityQuerySchema = z.object({
  from: z.coerce.date({ message: "Start date is required" }),
  to: z.coerce.date({ message: "End date is required" }),
});

export const adminVehicleRejectSchema = z.object({
  reason: z.string().trim().min(3, "A rejection reason is required"),
});
