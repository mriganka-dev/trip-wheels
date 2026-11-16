import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatPercentage,
  formatPhone,
  formatWaitingFor,
  toIsoUtc,
} from "@/lib/format";

describe("format helpers", () => {
  it("formatDateTime formats valid date input in en-IN locale", () => {
    const iso = "2026-05-15T10:30:00.000Z";
    const formatted = formatDateTime(iso);
    expect(formatted).toContain("May 2026");
    expect(formatted).toContain(",");
  });

  it("formatDateTime returns empty string for null, undefined or invalid dates", () => {
    expect(formatDateTime(null)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
    expect(formatDateTime("invalid-date-string")).toBe("");
  });

  it("formatDateOnly formats date without time", () => {
    const iso = "2026-05-15T10:30:00.000Z";
    const formatted = formatDateOnly(iso);
    expect(formatted).toContain("May 2026");
    expect(formatted).not.toContain(":");
  });

  it("formatWaitingFor returns distance to now", () => {
    const past = new Date(Date.now() - 3600 * 1000 * 2).toISOString();
    const result = formatWaitingFor(past);
    expect(result).toBe("2 hours");
  });

  it("formatPhone formats 10-digit Indian numbers and cleans non-digit characters", () => {
    expect(formatPhone("9876543210")).toBe("+91 98765 43210");
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhone("")).toBe("");
    expect(formatPhone(null)).toBe("");
  });

  it("formatCurrency formats Indian rupee amounts without decimals", () => {
    expect(formatCurrency(1500)).toContain("1,500");
    expect(formatCurrency(0)).toContain("0");
    expect(formatCurrency(null)).toContain("0");
  });

  it("formatPercentage formats numbers to one decimal place", () => {
    expect(formatPercentage(85.456)).toBe("85.5%");
    expect(formatPercentage(50)).toBe("50%");
    expect(formatPercentage(0)).toBe("0%");
    expect(formatPercentage(null)).toBe("0%");
  });

  it("toIsoUtc returns an ISO string representation", () => {
    const d = new Date("2026-01-01T12:00:00.000Z");
    expect(toIsoUtc(d)).toBe("2026-01-01T12:00:00.000Z");
  });
});
