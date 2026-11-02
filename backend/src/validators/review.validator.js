import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
});

export const hideReviewSchema = z.object({
  isHidden: z.boolean({
    required_error: "isHidden is required",
    invalid_type_error: "isHidden must be a boolean",
  }),
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
