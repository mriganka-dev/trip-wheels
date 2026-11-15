import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { AcceptBookingDialog } from "@/components/bookings/accept-booking-dialog";
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

describe("AcceptBookingDialog late acceptance rules", () => {
  const baseBooking: Booking = {
    _id: "book-accept-1",
    bookingCode: "TW-2026-0002",
    customer: {
      _id: "c2",
      fullName: "Priya Patel",
      phone: "9876543211",
      email: "priya@example.com",
    },
    vehicle: {
      _id: "v2",
      brand: "Hyundai",
      model: "i20",
      type: "car",
      pricing: { perDay: 2000 },
    },
    startAt: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), // 5 hours away (< 24h)
    endAt: new Date(Date.now() + 53 * 3600 * 1000).toISOString(),
    status: "requested",
    durationHours: 48,
    pricingSnapshot: {
      perDay: 2000,
      deposit: 3000,
      estimatedTotal: 4000,
    },
    createdAt: new Date().toISOString(),
  };

  it("requires vehicle details immediately when pickup is under 24 hours away (late acceptance)", () => {
    renderWithClient(
      <AcceptBookingDialog
        booking={baseBooking}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Shows urgent pickup notice
    expect(
      screen.getByText(/Pickup is less than 24 hours away/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Chassis number \*/i)).toBeInTheDocument();
  });

  it("shows advance booking notice when pickup is several days away", () => {
    const advanceBooking: Booking = {
      ...baseBooking,
      startAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), // 5 days away
      endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };

    renderWithClient(
      <AcceptBookingDialog
        booking={advanceBooking}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText(/You will need to confirm the exact vehicle by/i)
    ).toBeInTheDocument();
  });
});
