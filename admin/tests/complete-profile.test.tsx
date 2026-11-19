import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CompleteProfilePage from "@/app/(dashboard)/complete-profile/page";
import * as authApi from "@/lib/api/auth";
import * as useAuthHook from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  completeProfile: vi.fn(),
}));

describe("CompleteProfilePage (admin)", () => {
  const mockRefetchUser = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useAuthHook, "useAuth").mockReturnValue({
      user: {
        _id: "user-1",
        fullName: "Ramesh Patel",
        email: "ramesh@example.com",
        phone: "",
        role: "agent",
        isEmailVerified: true,
        accountStatus: "active",
        profileComplete: false,
        authProviders: ["google"],
        hasPassword: false,
      },
      profile: {
        _id: "p1",
        user: "user-1",
        publisherType: "agent",
        verificationStatus: "not_submitted",
      },
      isLoading: false,
      isAuthenticated: true,
      isEmailVerified: true,
      profileComplete: false,
      authProviders: ["google"],
      hasPassword: false,
      verificationStatus: "not_submitted",
      login: vi.fn(),
      isLoggingIn: false,
      logout: vi.fn(),
      isLoggingOut: false,
      refetchUser: mockRefetchUser,
      refetchProfile: vi.fn(),
    });
  });

  it("renders heading and explanation line", () => {
    render(<CompleteProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Complete your profile" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "We call this number to verify your account, and customers see it after you accept a booking."
      )
    ).toBeInTheDocument();
  });

  it("displays non-editable owner type", () => {
    render(<CompleteProfilePage />);

    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(
      screen.getByText("Set during registration and cannot be changed.")
    ).toBeInTheDocument();
  });

  it("prefills full name and allows editing", () => {
    render(<CompleteProfilePage />);

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Ramesh Patel");

    fireEvent.change(nameInput, { target: { value: "Ramesh Kumar Patel" } });
    expect(nameInput.value).toBe("Ramesh Kumar Patel");
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
        screen.getByText("Enter a valid 10-digit Indian mobile number")
      ).toBeInTheDocument();
    });
    expect(authApi.completeProfile).not.toHaveBeenCalled();
  });

  it("formats phone number with 91 prefix on submit and redirects to /verification", async () => {
    vi.mocked(authApi.completeProfile).mockResolvedValue({
      _id: "user-1",
      fullName: "Ramesh Patel",
      email: "ramesh@example.com",
      phone: "919876543210",
      role: "agent",
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
        fullName: "Ramesh Patel",
        phone: "919876543210",
      });
      expect(mockRefetchUser).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/verification");
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
        fullName: "Ramesh Patel",
        email: "ramesh@example.com",
        phone: "919876543210",
        role: "agent",
        isEmailVerified: true,
        accountStatus: "active",
        profileComplete: true,
      },
      profile: null,
      isLoading: false,
      isAuthenticated: true,
      isEmailVerified: true,
      profileComplete: true,
      authProviders: ["google"],
      hasPassword: false,
      verificationStatus: "not_submitted",
      login: vi.fn(),
      isLoggingIn: false,
      logout: vi.fn(),
      isLoggingOut: false,
      refetchUser: mockRefetchUser,
      refetchProfile: vi.fn(),
    });

    render(<CompleteProfilePage />);
    expect(mockPush).toHaveBeenCalledWith("/verification");
  });
});
