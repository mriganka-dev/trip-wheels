import { z } from "zod";
import { DOCUMENT_STATUS, DOCUMENT_TYPES } from "../constants.js";

export const updatePublisherProfileSchema = z.object({
  businessName: z.string().trim().min(2).optional(),
  businessAddress: z.string().trim().min(3).optional(),
  gstNumber: z.string().trim().optional(),
  destination: z.string().trim().optional(),
  agentPickup: z
    .object({
      address: z.string().trim().min(3).optional(),
      landmark: z.string().trim().optional(),
      location: z
        .object({
          type: z.literal("Point").default("Point"),
          coordinates: z
            .array(z.number())
            .length(2, "Coordinates must be [longitude, latitude]")
            .refine(
              ([lng, lat]) =>
                lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
              { message: "Coordinates are out of valid range" }
            ),
        })
        .optional(),
    })
    .optional(),
  individualArea: z
    .object({
      city: z.string().trim().min(2).optional(),
      area: z.string().trim().min(2).optional(),
      approxLocation: z
        .object({
          type: z.literal("Point").default("Point"),
          coordinates: z
            .array(z.number())
            .length(2, "Coordinates must be [longitude, latitude]")
            .refine(
              ([lng, lat]) =>
                lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
              { message: "Coordinates are out of valid range" }
            )
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

export const uploadDocumentSchema = z.object({
  type: z.enum(Object.values(DOCUMENT_TYPES)),
  documentNumber: z
    .string()
    .trim()
    .min(3, "Document number must be at least 3 characters"),
});

export const adminRejectionSchema = z.object({
  reason: z.string().trim().min(3, "A detailed rejection reason is required"),
});

export const adminVerificationCallSchema = z.object({
  notes: z.string().trim().optional().default(""),
});

export const adminReviewDocumentSchema = z.object({
  status: z.enum([DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.REJECTED]),
  remarks: z.string().trim().optional().default(""),
});

export const adminSuspendUserSchema = z.object({
  reason: z.string().trim().min(3, "Suspension reason is required"),
});
