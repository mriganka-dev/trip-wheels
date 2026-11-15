import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { HandoverSection } from "@/components/bookings/handover-section";
import type { Booking } from "@/types/booking";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ToastProvider>
  );
}

describe("HandoverSection checklist verification", () => {
  const mockBooking: Booking = {
    _id: "book-123",
    bookingCode: "TW-2026-0001",
    customer: {
      _id: "c1",
      fullName: "Ankit Sharma",
      phone: "9876543210",
      email: "ankit@example.com",
    },
    vehicle: {
      _id: "v1",
      brand: "Royal Enfield",
      model: "Classic 350",
      type: "bike",
      pricing: { perDay: 1200 },
    },
    startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    status: "confirmed",
    durationHours: 48,
    pricingSnapshot: {
      perDay: 1200,
      deposit: 2000,
      estimatedTotal: 2400,
    },
    createdAt: new Date().toISOString(),
  };

  it("keeps 'Hand over the vehicle' button disabled until BOTH checks are ticked", () => {
    renderWithClient(<HandoverSection booking={mockBooking} />);

    const handoverBtn = screen.getByRole("button", {
      name: /hand over the vehicle/i,
    });
    const idCheck = screen.getByLabelText(/I checked the customer's government ID/i);
    const licenseCheck = screen.getByLabelText(/I checked a valid driving license/i);

    // Initial state: neither checked -> disabled
    expect(handoverBtn).toBeDisabled();

    // Check 1 only -> still disabled
    fireEvent.click(idCheck);
    expect(handoverBtn).toBeDisabled();

    // Uncheck 1, Check 2 only -> still disabled
    fireEvent.click(idCheck);
    fireEvent.click(licenseCheck);
    expect(handoverBtn).toBeDisabled();

    // Both checked -> enabled
    fireEvent.click(idCheck);
    expect(handoverBtn).toBeEnabled();
  });
});
