import "server-only";
import { z } from "zod";

const envSchema = z.object({
  APP_URL: z
    .string()
    .min(1, "Missing required environment variable: APP_URL")
    .url("Invalid URL format for environment variable: APP_URL"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse({
  APP_URL: process.env.APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  const issues = parsed.error.issues;
  const first = issues[0];
  const message = first?.message || "Invalid environment variables configuration";
  throw new Error(message);
}

const validatedEnv = parsed.data;

export function getAppUrl(): string {
  return validatedEnv.APP_URL;
}

export function isProduction(): boolean {
  return validatedEnv.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return validatedEnv.NODE_ENV === "development";
}
