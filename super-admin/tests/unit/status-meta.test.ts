import { describe, expect, it } from "vitest";
import {
  ACCOUNT_STATUS_META,
  BOOKING_STATUS_META,
  DOCUMENT_STATUS_META,
  ISSUE_STATUS_META,
  ROLE_LABELS,
  TASK_STATUS_META,
  VEHICLE_STATUS_META,
  VERIFICATION_STATUS_META,
} from "@/lib/constants";

describe("status label mappings", () => {
  it("maps verification statuses to correct human labels and tones", () => {
    expect(VERIFICATION_STATUS_META.pending).toEqual({
      label: "Waiting for review",
      tone: "warning",
    });
    expect(VERIFICATION_STATUS_META.approved).toEqual({
      label: "Approved",
      tone: "brand",
    });
    expect(VERIFICATION_STATUS_META.rejected).toEqual({
      label: "Not approved",
      tone: "negative",
    });
    expect(VERIFICATION_STATUS_META.reverification_required).toEqual({
      label: "New documents needed",
      tone: "warning",
    });
    expect(VERIFICATION_STATUS_META.suspended).toEqual({
      label: "Suspended",
      tone: "negative",
    });
  });

  it("maps vehicle statuses correctly", () => {
    expect(VEHICLE_STATUS_META.pending_review.label).toBe("Waiting for review");
    expect(VEHICLE_STATUS_META.active.label).toBe("Live");
    expect(VEHICLE_STATUS_META.suspended.label).toBe("Suspended");
    expect(VEHICLE_STATUS_META.rejected.label).toBe("Not approved");
  });

  it("maps booking statuses correctly without emojis or forbidden symbols", () => {
    expect(BOOKING_STATUS_META.requested.label).toBe("Requested");
    expect(BOOKING_STATUS_META.confirmed.label).toBe("Confirmed");
    expect(BOOKING_STATUS_META.no_show.label).toBe("No show");
    expect(BOOKING_STATUS_META.completed.label).toBe("Completed");
    expect(BOOKING_STATUS_META.ongoing.label).toBe("On trip");
  });

  it("maps issue statuses correctly", () => {
    expect(ISSUE_STATUS_META.open.label).toBe("Open");
    expect(ISSUE_STATUS_META.under_review.label).toBe("Under review");
    expect(ISSUE_STATUS_META.resolved.label).toBe("Resolved");
    expect(ISSUE_STATUS_META.dismissed.label).toBe("Dismissed");
  });

  it("maps account statuses and roles", () => {
    expect(ACCOUNT_STATUS_META.active.label).toBe("Active");
    expect(ACCOUNT_STATUS_META.suspended.label).toBe("Suspended");
    expect(ROLE_LABELS.admin).toBe("Admin");
    expect(ROLE_LABELS.agent).toBe("Agent");
    expect(ROLE_LABELS.individual).toBe("Individual");
    expect(ROLE_LABELS.customer).toBe("Customer");
  });

  it("maps document and task statuses", () => {
    expect(DOCUMENT_STATUS_META.pending.label).toBe("Waiting for review");
    expect(DOCUMENT_STATUS_META.approved.label).toBe("Approved");
    expect(TASK_STATUS_META.open.label).toBe("Open");
    expect(TASK_STATUS_META.done.label).toBe("Done");
  });
});
