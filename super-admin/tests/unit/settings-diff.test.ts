import { describe, expect, it } from "vitest";
import {
  calculateSettingsDiff,
  parseNumberCsv,
  settingsValidationSchema,
} from "@/lib/settings-diff";
import { DEFAULT_BUSINESS_SETTINGS } from "@/types/system";

describe("settings change summary and validation", () => {
  it("detects changed number fields and formats change summary", () => {
    const original = { ...DEFAULT_BUSINESS_SETTINGS };
    const updated = {
      RESPONSE_WINDOW_HOURS: "8",
      MIN_BOOKING_LEAD_HOURS: "6",
    };

    const diffs = calculateSettingsDiff(original, updated);
    expect(diffs).toHaveLength(2);

    const responseWindowDiff = diffs.find((d) => d.key === "RESPONSE_WINDOW_HOURS");
    expect(responseWindowDiff).toBeDefined();
    expect(responseWindowDiff?.oldValueText).toBe("4 hours");
    expect(responseWindowDiff?.newValueText).toBe("8 hours");
    expect(responseWindowDiff?.parsedValue).toBe(8);
  });

  it("detects array changes and parses comma-separated numbers", () => {
    const original = { ...DEFAULT_BUSINESS_SETTINGS };
    const updated = {
      VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: "48, 24, 12",
    };

    const diffs = calculateSettingsDiff(original, updated);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].oldValueText).toBe("24, 18, 14");
    expect(diffs[0].newValueText).toBe("48, 24, 12");
    expect(diffs[0].parsedValue).toEqual([48, 24, 12]);
  });

  it("returns empty diff when values are unchanged", () => {
    const original = { ...DEFAULT_BUSINESS_SETTINGS };
    const updated = {
      RESPONSE_WINDOW_HOURS: "4",
      MIN_BOOKING_LEAD_HOURS: "3",
    };

    const diffs = calculateSettingsDiff(original, updated);
    expect(diffs).toHaveLength(0);
  });

  it("validates that reminder intervals must be in strictly descending order", () => {
    const validReminders = [24, 18, 12];
    const invalidRemindersAscending = [12, 18, 24];
    const invalidRemindersDuplicate = [24, 24, 12];

    const validPayload = {
      ...DEFAULT_BUSINESS_SETTINGS,
      VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: validReminders,
    };
    expect(settingsValidationSchema.safeParse(validPayload).success).toBe(true);

    const invalidAscendingPayload = {
      ...DEFAULT_BUSINESS_SETTINGS,
      VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: invalidRemindersAscending,
    };
    expect(settingsValidationSchema.safeParse(invalidAscendingPayload).success).toBe(
      false
    );

    const invalidDuplicatePayload = {
      ...DEFAULT_BUSINESS_SETTINGS,
      VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: invalidRemindersDuplicate,
    };
    expect(settingsValidationSchema.safeParse(invalidDuplicatePayload).success).toBe(
      false
    );
  });

  it("parseNumberCsv splits comma-separated strings into numbers", () => {
    expect(parseNumberCsv("30, 7, 1")).toEqual([30, 7, 1]);
    expect(parseNumberCsv("  10 , 5 ")).toEqual([10, 5]);
    expect(parseNumberCsv("")).toEqual([]);
  });
});
