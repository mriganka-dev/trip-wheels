import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatTime,
  formatPhone,
  getTelLink,
  formatCountdown,
  formatDurationHours,
  formatDurationBetween,
  toDateTimeLocalString,
} from "@/lib/format";

describe("lib/format helpers", () => {
  it("formats Indian Rupee currency with symbol and comma separation", () => {
    const formatted = formatCurrency(1499);
    expect(formatted).toContain("1,499");
  });

  it("formats dates and times consistently", () => {
    const isoString = "2026-11-20T14:30:00.000Z";
    const dateFormatted = formatDate(isoString);
    const timeFormatted = formatTime(isoString);
    const dateTimeFormatted = formatDateTime(isoString);

    expect(dateFormatted).toContain("2026");
    expect(dateFormatted).toContain("Nov");
    expect(typeof timeFormatted).toBe("string");
    expect(dateTimeFormatted).toContain("2026");
  });

  it("formats 10-digit phone numbers with +91 country prefix and spacing", () => {
    expect(formatPhone("9876543210")).toBe("+91 98765 43210");
  });

  it("generates tel: links with +91 prefix", () => {
    expect(getTelLink("9876543210")).toBe("tel:+919876543210");
    expect(getTelLink("+919876543210")).toBe("tel:+919876543210");
  });

  it("calculates countdown text for upcoming deadlines", () => {
    const now = new Date();
    const future30Min = new Date(now.getTime() + 30 * 60 * 1000);
    const countdown30 = formatCountdown(future30Min);
    expect(countdown30).toContain("min left");

    const past = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatCountdown(past)).toBe("Time is up");
  });

  it("formats duration in hours and days cleanly", () => {
    expect(formatDurationHours(4)).toBe("4 hrs");
    expect(formatDurationHours(1)).toBe("1 hr");
    expect(formatDurationHours(24)).toBe("1 day");
    expect(formatDurationHours(48)).toBe("2 days");
    expect(formatDurationHours(52)).toBe("2 days 4 hrs");
  });

  it("formats duration between two dates", () => {
    const start = "2026-11-20T10:00:00Z";
    const end = "2026-11-22T10:00:00Z";
    expect(formatDurationBetween(start, end)).toBe("2 days");
  });

  it("formats date to input datetime-local string format", () => {
    const d = new Date(2026, 10, 25, 14, 45);
    expect(toDateTimeLocalString(d)).toBe("2026-11-25T14:45");
  });
});
