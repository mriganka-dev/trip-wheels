import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatTime,
  formatPhone,
  getTelLink,
  formatDurationHours,
  toDateTimeLocalString,
} from "@/lib/format";

describe("lib/format helpers", () => {
  it("formats Indian Rupee currency correctly", () => {
    const formatted = formatCurrency(1299);
    // INR formatted string contains ₹ and digits
    expect(formatted).toContain("1,299");
  });

  it("formats date, time, and datetime strings", () => {
    const isoString = "2026-11-20T09:30:00.000Z";
    const dateFormatted = formatDate(isoString);
    const timeFormatted = formatTime(isoString);
    const dateTimeFormatted = formatDateTime(isoString);

    expect(dateFormatted).toContain("2026");
    expect(dateFormatted).toContain("Nov");
    expect(typeof timeFormatted).toBe("string");
    expect(dateTimeFormatted).toContain("2026");
  });

  it("formats 10-digit Indian phone numbers with country code and spacing", () => {
    expect(formatPhone("9876543210")).toBe("+91 98765 43210");
  });

  it("generates valid tel: links with +91 prefix", () => {
    expect(getTelLink("9876543210")).toBe("tel:+919876543210");
    expect(getTelLink("+919876543210")).toBe("tel:+919876543210");
  });

  it("formats duration in hours and days correctly", () => {
    expect(formatDurationHours(5)).toBe("5 hrs");
    expect(formatDurationHours(1)).toBe("1 hr");
    expect(formatDurationHours(24)).toBe("1 day");
    expect(formatDurationHours(48)).toBe("2 days");
    expect(formatDurationHours(50)).toBe("2 days 2 hrs");
  });

  it("formats date to local datetime-local input string format", () => {
    const d = new Date(2026, 10, 20, 9, 30);
    const local = toDateTimeLocalString(d);
    expect(local).toBe("2026-11-20T09:30");
  });
});

