import { z } from "zod";
import { ADMIN_TASK_STATUS } from "../constants.js";

export const savePushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url("Valid push endpoint URL is required"),
  keys: z.object({
    p256dh: z.string().trim().min(1, "p256dh key is required"),
    auth: z.string().trim().min(1, "auth key is required"),
  }),
  userAgent: z.string().trim().optional(),
  platform: z.string().trim().optional(),
});

export const removePushSubscriptionSchema = z.object({
  endpoint: z.string().trim().min(1, "Endpoint is required"),
});

export const updateAdminTaskSchema = z.object({
  status: z.enum(Object.values(ADMIN_TASK_STATUS)).optional(),
  note: z.string().trim().optional(),
  assignedTo: z.string().optional(),
});

