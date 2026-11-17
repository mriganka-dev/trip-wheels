import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CustomerLayout from "@/app/(customer)/layout";
import * as useAuthHook from "@/hooks/use-auth";

const mockPush = vi.fn();
let mockPathname = "/bookings";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe("CustomerLayout guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/bookings";
  });

  it("redirects to complete-profile when profileComplete is false on protected routes", () => {
    vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
      user: {
        _id: "u1",
        fullName: "Aarav Patel",
        email: "aarav@example.com",
        phone: "",
        role: "customer",
        isEmailVerified: true,
        accountStatus: "active",
        profileComplete: false,
        authProviders: ["google"],
        hasPassword: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isEmailVerified: true,
      profileComplete: false,
      authProviders: ["google"],
      hasPassword: false,
      isCustomer: true,
      isSuspended: false,
      suspendedReason: undefined,
      login: vi.fn(),
      isLoggingIn: false,
      logout: vi.fn(),
      isLoggingOut: false,
      refreshUser: vi.fn(),
    });

    render(
      <CustomerLayout>
        <div>Protected Content</div>
      </CustomerLayout>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/complete-profile?next=%2Fbookings");
  });

  it("allows rendering when on /complete-profile even if profileComplete is false", () => {
    mockPathname = "/complete-profile";

    vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
      user: {
        _id: "u1",
        fullName: "Aarav Patel",
        email: "aarav@example.com",
        phone: "",
        role: "customer",
        isEmailVerified: true,
        accountStatus: "active",
        profileComplete: false,
        authProviders: ["google"],
        hasPassword: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isEmailVerified: true,
      profileComplete: false,
      authProviders: ["google"],
      hasPassword: false,
      isCustomer: true,
      isSuspended: false,
      suspendedReason: undefined,
      login: vi.fn(),
      isLoggingIn: false,
      logout: vi.fn(),
      isLoggingOut: false,
      refreshUser: vi.fn(),
    });

    render(
      <CustomerLayout>
        <div>Complete Profile Form</div>
      </CustomerLayout>
    );

    expect(screen.getByText("Complete Profile Form")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("allows rendering protected content when profile is complete", () => {
    mockPathname = "/bookings";

    vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
      user: {
        _id: "u1",
        fullName: "Aarav Patel",
        email: "aarav@example.com",
        phone: "919876543210",
        role: "customer",
        isEmailVerified: true,
        accountStatus: "active",
        profileComplete: true,
        authProviders: ["google"],
        hasPassword: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isEmailVerified: true,
      profileComplete: true,
      authProviders: ["google"],
      hasPassword: false,
      isCustomer: true,
      isSuspended: false,
      suspendedReason: undefined,
      login: vi.fn(),
      isLoggingIn: false,
      logout: vi.fn(),
      isLoggingOut: false,
      refreshUser: vi.fn(),
    });

    render(
      <CustomerLayout>
        <div>Protected Content</div>
      </CustomerLayout>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
