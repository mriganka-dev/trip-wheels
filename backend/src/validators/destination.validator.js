import { z } from "zod";

const coordinatesSchema = z
  .array(z.number())
  .length(2, "Coordinates must be [longitude, latitude]")
  .refine(
    ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
    {
      message: "Coordinates are out of valid range",
    }
  );

const landmarkSchema = z.object({
  name: z.string().trim().min(1, "Landmark name is required"),
  type: z
    .enum(["railway_station", "airport", "bus_stand", "other"])
    .default("other"),
  location: z.object({
    type: z.literal("Point").default("Point"),
    coordinates: coordinatesSchema,
  }),
});

export const createDestinationSchema = z.object({
  name: z.string().trim().min(2, "Destination name is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  state: z.string().trim().min(2, "State is required"),
  country: z.string().trim().default("India"),
  location: z.object({
    type: z.literal("Point").default("Point"),
    coordinates: coordinatesSchema,
  }),
  isActive: z.boolean().default(true),
  nearbyDestinations: z.array(z.string()).optional().default([]),
  landmarks: z.array(landmarkSchema).optional().default([]),
});

export const updateDestinationSchema = z.object({
  name: z.string().trim().min(2).optional(),
  state: z.string().trim().min(2).optional(),
  country: z.string().trim().optional(),
  location: z
    .object({
      type: z.literal("Point").default("Point"),
      coordinates: coordinatesSchema,
    })
    .optional(),
  isActive: z.boolean().optional(),
  nearbyDestinations: z.array(z.string()).optional(),
  landmarks: z.array(landmarkSchema).optional(),
});
