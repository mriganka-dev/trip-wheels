import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CompleteProfilePage from "@/app/(customer)/complete-profile/page";
import * as authApi from "@/lib/api/auth";
import * as useAuthHook from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/api/auth", () => ({
  completeProfile: vi.fn(),
}));

describe("CompleteProfilePage", () => {
  const mockRefreshUser = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();

    vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
      user: {
        _id: "user-1",
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
      refreshUser: mockRefreshUser,
    });
  });

  it("renders heading and notice line", () => {
    render(<CompleteProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Complete your profile" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Owners see your phone number after they accept your booking."
      )
    ).toBeInTheDocument();
  });

  it("prefills full name from account and allows editing", () => {
    render(<CompleteProfilePage />);

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Aarav Patel");

    fireEvent.change(nameInput, { target: { value: "Aarav Sharma" } });
    expect(nameInput.value).toBe("Aarav Sharma");
  });

  it("validates 10-digit Indian phone number", async () => {
    render(<CompleteProfilePage />);

    const phoneInput = screen.getByLabelText(/mobile number/i);
    const submitButton = screen.getByRole("button", {
      name: /save and continue/i,
    });

    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Enter a valid 10 digit Indian mobile number starting with 6, 7, 8 or 9"
        )
      ).toBeInTheDocument();
    });
    expect(authApi.completeProfile).not.toHaveBeenCalled();
  });

  it("formats phone number with 91 prefix on submit and redirects to next safe path", async () => {
    mockSearchParams = new URLSearchParams("next=%2Fbook%2Fv100");
    vi.mocked(authApi.completeProfile).mockResolvedValue({
      _id: "user-1",
      fullName: "Aarav Patel",
      email: "aarav@example.com",
      phone: "919876543210",
      role: "customer",
      isEmailVerified: true,
      accountStatus: "active",
      profileComplete: true,
    });

    render(<CompleteProfilePage />);

    const phoneInput = screen.getByLabelText(/mobile number/i);
    const submitButton = screen.getByRole("button", {
      name: /save and continue/i,
    });

    fireEvent.change(phoneInput, { target: { value: "9876543210" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.completeProfile).toHaveBeenCalledWith({
        fullName: "Aarav Patel",
        phone: "919876543210",
      });
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/book/v100");
    });
  });

  it("displays duplicate phone error on phone field when API returns 409", async () => {
    vi.mocked(authApi.completeProfile).mockRejectedValue(
      new ApiError(409, "Phone number is already in use")
    );

    render(<CompleteProfilePage />);

    const phoneInput = screen.getByLabelText(/mobile number/i);
    const submitButton = screen.getByRole("button", {
      name: /save and continue/i,
    });

    fireEvent.change(phoneInput, { target: { value: "9876543210" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Phone number is already in use")
      ).toBeInTheDocument();
    });
  });

  it("redirects away if profile is already complete", () => {
    vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
      user: {
        _id: "user-1",
        fullName: "Aarav Patel",
        email: "aarav@example.com",
        phone: "919876543210",
        role: "customer",
        isEmailVerified: true,
        accountStatus: "active",
        profileComplete: true,
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
      refreshUser: mockRefreshUser,
    });

    render(<CompleteProfilePage />);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
