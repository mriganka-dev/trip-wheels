import { z } from "zod";
import type { PlatformSettings, UpdateSettingsPayload } from "@/types/system";

export const settingsValidationSchema = z.object({
  RESPONSE_WINDOW_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(48, "Maximum is 48 hours"),
  MIN_BOOKING_LEAD_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(72, "Maximum is 72 hours"),
  MAX_ACTIVE_REQUESTS_PER_CUSTOMER: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 request")
    .max(20, "Maximum is 20 requests"),
  VEHICLE_CONFIRMATION_LEAD_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(72, "Maximum is 72 hours"),
  VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: z
    .array(z.number().int().min(1, "Each reminder hour must be at least 1"))
    .min(1, "At least one reminder value is required")
    .refine(
      (arr) => arr.every((val, i) => i === 0 || val < arr[i - 1]),
      "Reminder hours must be in strictly descending order"
    ),
  VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(48, "Maximum is 48 hours"),
  LATE_DISCLOSURE_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(72, "Maximum is 72 hours"),
  PRE_PICKUP_REMINDER_HOURS_BEFORE: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(24, "Maximum is 24 hours"),
  NO_SHOW_GRACE_MINUTES: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(15, "Minimum is 15 minutes")
    .max(360, "Maximum is 360 minutes"),
  AUTO_COMPLETE_GRACE_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(48, "Maximum is 48 hours"),
  INDIVIDUAL_MAX_VEHICLES: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 vehicle")
    .max(10, "Maximum is 10 vehicles"),
  OTP_EXPIRY_MINUTES: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 minute")
    .max(60, "Maximum is 60 minutes"),
  OTP_MAX_ATTEMPTS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 attempt")
    .max(10, "Maximum is 10 attempts"),
  OTP_RESEND_COOLDOWN_SECONDS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(10, "Minimum is 10 seconds")
    .max(300, "Maximum is 300 seconds"),
  OTP_MAX_PER_HOUR: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 code")
    .max(20, "Maximum is 20 codes"),
  REVIEW_WINDOW_DAYS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 day")
    .max(90, "Maximum is 90 days"),
  ISSUE_WINDOW_DAYS_AFTER_COMPLETION: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 day")
    .max(90, "Maximum is 90 days"),
  INSURANCE_EXPIRY_WARNING_DAYS: z
    .array(z.number().int().min(1, "Each warning day must be at least 1"))
    .min(1, "At least one warning day is required")
    .refine(
      (arr) => arr.every((val, i) => i === 0 || val < arr[i - 1]),
      "Warning days must be in strictly descending order"
    ),
});

export interface SettingsDiffItem {
  key: keyof UpdateSettingsPayload;
  label: string;
  unit: string;
  oldValueText: string;
  newValueText: string;
  parsedValue: unknown;
}

export function parseNumberCsv(str: string): number[] {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s));
}

export function calculateSettingsDiff(
  original: PlatformSettings,
  updated: Record<string, string>
): SettingsDiffItem[] {
  const diffs: SettingsDiffItem[] = [];

  const checkNumber = (
    key: keyof UpdateSettingsPayload,
    label: string,
    unit: string
  ) => {
    const curVal = original[key] as number;
    const rawVal = updated[key as string];
    if (rawVal === undefined || rawVal === "") return;
    const parsed = Number(rawVal);
    if (!Number.isNaN(parsed) && parsed !== curVal) {
      diffs.push({
        key,
        label,
        unit,
        oldValueText: `${curVal} ${unit}`,
        newValueText: `${parsed} ${unit}`,
        parsedValue: parsed,
      });
    }
  };

  const checkArray = (
    key: "VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE" | "INSURANCE_EXPIRY_WARNING_DAYS",
    label: string,
    unit: string
  ) => {
    const curArr = (original[key] as number[]) || [];
    const rawVal = updated[key as string];
    if (rawVal === undefined || rawVal === "") return;
    const parsedArr = parseNumberCsv(rawVal);
    const isDifferent =
      curArr.length !== parsedArr.length ||
      curArr.some((val, idx) => val !== parsedArr[idx]);

    if (isDifferent && parsedArr.length > 0 && !parsedArr.some(Number.isNaN)) {
      diffs.push({
        key,
        label,
        unit,
        oldValueText: curArr.join(", "),
        newValueText: parsedArr.join(", "),
        parsedValue: parsedArr,
      });
    }
  };

  checkNumber("RESPONSE_WINDOW_HOURS", "Response window", "hours");
  checkNumber("MIN_BOOKING_LEAD_HOURS", "Minimum booking lead time", "hours");
  checkNumber(
    "MAX_ACTIVE_REQUESTS_PER_CUSTOMER",
    "Maximum active requests per customer",
    "requests"
  );
  checkNumber(
    "VEHICLE_CONFIRMATION_LEAD_HOURS",
    "Vehicle confirmation lead time",
    "hours"
  );
  checkArray(
    "VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE",
    "Vehicle confirmation reminders",
    "hours"
  );
  checkNumber(
    "VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE",
    "Vehicle confirmation deadline",
    "hours"
  );
  checkNumber("LATE_DISCLOSURE_HOURS", "Late disclosure window", "hours");
  checkNumber(
    "PRE_PICKUP_REMINDER_HOURS_BEFORE",
    "Pre-pickup reminder",
    "hours"
  );
  checkNumber("NO_SHOW_GRACE_MINUTES", "No-show grace period", "minutes");
  checkNumber(
    "AUTO_COMPLETE_GRACE_HOURS",
    "Auto-complete grace period",
    "hours"
  );
  checkNumber(
    "INDIVIDUAL_MAX_VEHICLES",
    "Individual owner vehicle limit",
    "vehicles"
  );
  checkNumber("OTP_EXPIRY_MINUTES", "OTP validity duration", "minutes");
  checkNumber("OTP_MAX_ATTEMPTS", "OTP maximum attempts", "attempts");
  checkNumber(
    "OTP_RESEND_COOLDOWN_SECONDS",
    "OTP resend cooldown",
    "seconds"
  );
  checkNumber("OTP_MAX_PER_HOUR", "OTP hourly limit", "codes");
  checkNumber("REVIEW_WINDOW_DAYS", "Review submission window", "days");
  checkNumber(
    "ISSUE_WINDOW_DAYS_AFTER_COMPLETION",
    "Issue reporting window",
    "days"
  );
  checkArray(
    "INSURANCE_EXPIRY_WARNING_DAYS",
    "Insurance expiry warning days",
    "days"
  );

  return diffs;
}
