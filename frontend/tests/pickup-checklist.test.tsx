import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  PickupChecklist,
  getChecklistStorageKey,
  DEFAULT_CHECKLIST_STATE,
  isChecklistComplete,
} from "@/components/booking/pickup-checklist";

describe("Pickup checklist logic and component", () => {
  const bookingId = "bkg_test_12345";
  const storageKey = getChecklistStorageKey(bookingId);

  beforeEach(() => {
    localStorage.clear();
  });

  describe("Helper functions", () => {
    it("generates correct storage key", () => {
      expect(storageKey).toBe("tw_pickup_checklist_bkg_test_12345");
    });

    it("verifies default checklist state is all false", () => {
      expect(DEFAULT_CHECKLIST_STATE).toEqual({
        chassis: false,
        registration: false,
        condition: false,
        documents: false,
      });
    });

    it("evaluates completeness accurately", () => {
      expect(isChecklistComplete(DEFAULT_CHECKLIST_STATE)).toBe(false);

      expect(
        isChecklistComplete({
          chassis: true,
          registration: true,
          condition: true,
          documents: false,
        })
      ).toBe(false);

      expect(
        isChecklistComplete({
          chassis: true,
          registration: true,
          condition: true,
          documents: true,
        })
      ).toBe(true);
    });
  });

  describe("Component behavior", () => {
    it("renders all four verification checklist items", async () => {
      render(<PickupChecklist bookingId={bookingId} />);

      await waitFor(() => {
        expect(screen.getByText("Pickup Checklist")).toBeInTheDocument();
      });

      expect(screen.getByText("Chassis number matches")).toBeInTheDocument();
      expect(screen.getByText("Registration number matches the number plate")).toBeInTheDocument();
      expect(screen.getByText("Vehicle matches the photos and what was booked")).toBeInTheDocument();
      expect(screen.getByText("I have my government ID and driving license")).toBeInTheDocument();
    });

    it("loads saved state from localStorage", async () => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          chassis: true,
          registration: true,
          condition: false,
          documents: false,
        })
      );

      render(<PickupChecklist bookingId={bookingId} />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
        expect(checkboxes[0].checked).toBe(true);
        expect(checkboxes[1].checked).toBe(true);
        expect(checkboxes[2].checked).toBe(false);
        expect(checkboxes[3].checked).toBe(false);
      });
    });

    it("updates localStorage when an item is toggled", async () => {
      render(<PickupChecklist bookingId={bookingId} />);

      await waitFor(() => {
        expect(screen.getByText("Pickup Checklist")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
      expect(stored.chassis).toBe(true);
    });

    it("displays Ready to accept badge when all 4 items are checked", async () => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          chassis: true,
          registration: true,
          condition: true,
          documents: true,
        })
      );

      render(<PickupChecklist bookingId={bookingId} />);

      await waitFor(() => {
        expect(screen.getByText("Ready to accept")).toBeInTheDocument();
      });
    });
  });
});

