import { z } from "zod";
import {
  ISSUE_RESOLUTION_OUTCOMES,
  ISSUE_SEVERITY,
  ISSUE_STATUS,
  ISSUE_TYPES,
} from "../constants.js";

export const createIssueSchema = z.object({
  type: z.enum(Object.values(ISSUE_TYPES), {
    errorMap: () => ({
      message: `type must be one of: ${Object.values(ISSUE_TYPES).join(", ")}`,
    }),
  }),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  severity: z.enum(Object.values(ISSUE_SEVERITY)).optional(),
});

export const respondIssueSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "Response must be at least 3 characters")
    .max(2000, "Response cannot exceed 2000 characters"),
});

export const resolveAdminIssueSchema = z.object({
  outcome: z.enum(Object.values(ISSUE_RESOLUTION_OUTCOMES), {
    errorMap: () => ({
      message: `outcome must be one of: ${Object.values(ISSUE_RESOLUTION_OUTCOMES).join(", ")}`,
    }),
  }),
  adminNote: z.string().trim().max(1000).optional(),
  penaltyApplied: z.boolean().optional(),
  suspendPublisher: z.boolean().optional(),
  suspendVehicle: z.boolean().optional(),
  suspendCustomer: z.boolean().optional(),
  status: z.enum(Object.values(ISSUE_STATUS)).optional(),
});

export const issueListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(Object.values(ISSUE_STATUS)).optional(),
  type: z.enum(Object.values(ISSUE_TYPES)).optional(),
  severity: z.enum(Object.values(ISSUE_SEVERITY)).optional(),
});
