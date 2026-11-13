import { describe, it, expect } from "vitest";
import { BOOKING_STATUS_CONFIG, type BookingStatus } from "@/lib/constants";

describe("Booking status label and tone mapping (A7)", () => {
  const expectedStatuses: BookingStatus[] = [
    "requested",
    "confirmed",
    "rejected",
    "expired",
    "cancelled_by_customer",
    "cancelled_by_publisher",
    "vehicle_unavailable",
    "handover_declined",
    "no_show",
    "ongoing",
    "completed",
  ];

  it("defines configuration for all 11 core booking statuses", () => {
    expectedStatuses.forEach((status) => {
      const config = BOOKING_STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(["neutral", "positive", "negative", "warning"]).toContain(config.tone);
    });
  });

  it("maps requested status to waiting for the owner label", () => {
    expect(BOOKING_STATUS_CONFIG.requested.label).toBe("Waiting for the owner");
    expect(BOOKING_STATUS_CONFIG.requested.tone).toBe("neutral");
  });

  it("maps confirmed status to positive tone", () => {
    expect(BOOKING_STATUS_CONFIG.confirmed.label).toBe("Confirmed");
    expect(BOOKING_STATUS_CONFIG.confirmed.tone).toBe("positive");
  });

  it("maps negative statuses correctly", () => {
    expect(BOOKING_STATUS_CONFIG.rejected.tone).toBe("negative");
    expect(BOOKING_STATUS_CONFIG.expired.tone).toBe("negative");
    expect(BOOKING_STATUS_CONFIG.cancelled_by_publisher.tone).toBe("negative");
    expect(BOOKING_STATUS_CONFIG.vehicle_unavailable.tone).toBe("negative");
    expect(BOOKING_STATUS_CONFIG.handover_declined.tone).toBe("negative");
    expect(BOOKING_STATUS_CONFIG.no_show.tone).toBe("negative");
  });

  it("maps ongoing trip to positive tone", () => {
    expect(BOOKING_STATUS_CONFIG.ongoing.label).toBe("On trip");
    expect(BOOKING_STATUS_CONFIG.ongoing.tone).toBe("positive");
  });

  it("maps completed trip to neutral tone", () => {
    expect(BOOKING_STATUS_CONFIG.completed.label).toBe("Completed");
    expect(BOOKING_STATUS_CONFIG.completed.tone).toBe("neutral");
  });
});

