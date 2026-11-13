import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(8000),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    DB_NAME: z.string().default("trip_wheels"),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    APP_BASE_URL: z
      .string()
      .url("APP_BASE_URL must be a valid URL")
      .default("http://localhost:3000"),
    ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
    ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
    REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
    REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    EMAIL_FROM: z.string().default("Trip Wheels <no-reply@tripwheels.com>"),
    VAPID_PUBLIC_KEY: z.string().default(""),
    VAPID_PRIVATE_KEY: z.string().default(""),
    VAPID_SUBJECT: z.string().default(""),
    WHATSAPP_ENABLED: z
      .union([z.boolean(), z.string()])
      .default(false)
      .transform((val) => val === true || val === "true"),
    JOBS_ENABLED: z
      .union([z.boolean(), z.string()])
      .default(true)
      .transform((val) => val === true || val === "true"),
    JOYTRIPS_BASE_URL: z.string().default("https://joytrips.example.com"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      const requiredInProd = [
        ["CLOUDINARY_CLOUD_NAME", data.CLOUDINARY_CLOUD_NAME],
        ["CLOUDINARY_API_KEY", data.CLOUDINARY_API_KEY],
        ["CLOUDINARY_API_SECRET", data.CLOUDINARY_API_SECRET],
        ["SMTP_HOST", data.SMTP_HOST],
        ["SMTP_USER", data.SMTP_USER],
        ["SMTP_PASS", data.SMTP_PASS],
        ["VAPID_PUBLIC_KEY", data.VAPID_PUBLIC_KEY],
        ["VAPID_PRIVATE_KEY", data.VAPID_PRIVATE_KEY],
        ["VAPID_SUBJECT", data.VAPID_SUBJECT],
      ];

      for (const [key, value] of requiredInProd) {
        if (!value || String(value).trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${key} is required in production`,
            path: [key],
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation failed:");
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
