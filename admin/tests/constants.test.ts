import { describe, it, expect } from "vitest";
import {
  getBookingStatusMeta,
  getVehicleStatusMeta,
  getVerificationStatusMeta,
  formatUnavailabilityReason,
  VEHICLE_CONFIRMATION_LEAD_HOURS,
  NO_SHOW_GRACE_MINUTES,
  INDIVIDUAL_MAX_VEHICLES,
} from "@/lib/constants";

describe("lib/constants status configuration and helpers", () => {
  it("maps booking statuses to correct human readable labels and tones", () => {
    expect(getBookingStatusMeta("requested")).toEqual({
      label: "New request",
      tone: "warning",
    });
    expect(getBookingStatusMeta("confirmed")).toEqual({
      label: "Confirmed",
      tone: "brand",
    });
    expect(getBookingStatusMeta("ongoing")).toEqual({
      label: "On trip",
      tone: "brand",
    });
    expect(getBookingStatusMeta("expired")).toEqual({
      label: "Expired, no reply",
      tone: "negative",
    });
    expect(getBookingStatusMeta("unknown_status")).toEqual({
      label: "unknown_status",
      tone: "neutral",
    });
  });

  it("maps vehicle statuses correctly", () => {
    expect(getVehicleStatusMeta("active")).toEqual({
      label: "Live",
      tone: "brand",
    });
    expect(getVehicleStatusMeta("draft")).toEqual({
      label: "Draft",
      tone: "neutral",
    });
    expect(getVehicleStatusMeta("rejected")).toEqual({
      label: "Not approved",
      tone: "negative",
    });
  });

  it("maps verification statuses accurately", () => {
    expect(getVerificationStatusMeta("approved")).toEqual({
      label: "Approved",
      tone: "brand",
    });
    expect(getVerificationStatusMeta("pending")).toEqual({
      label: "In review",
      tone: "warning",
    });
    expect(getVerificationStatusMeta("reverification_required")).toEqual({
      label: "New documents needed",
      tone: "warning",
    });
  });

  it("formats unavailability reasons with plain human labels", () => {
    expect(formatUnavailabilityReason("maintenance")).toBe("Maintenance");
    expect(formatUnavailabilityReason("rented_elsewhere")).toBe("Rented elsewhere");
    expect(formatUnavailabilityReason("custom_reason")).toBe("custom_reason");
  });

  it("maintains core business timings constants", () => {
    expect(VEHICLE_CONFIRMATION_LEAD_HOURS).toBe(24);
    expect(NO_SHOW_GRACE_MINUTES).toBe(120);
    expect(INDIVIDUAL_MAX_VEHICLES).toBe(2);
  });
});
