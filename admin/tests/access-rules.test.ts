import { describe, it, expect } from "vitest";
import { checkAccess } from "@/lib/access-rules";
import type { PublisherProfile, User } from "@/types/auth";

describe("lib/access-rules helper", () => {
  const verifiedAgentUser: User = {
    _id: "u1",
    fullName: "Rohan Das",
    email: "rohan@example.com",
    phone: "9876543210",
    role: "agent",
    isEmailVerified: true,
    accountStatus: "active",
  };

  const approvedProfile: PublisherProfile = {
    _id: "p1",
    user: "u1",
    publisherType: "agent",
    verificationStatus: "approved",
  };

  it("redirects unauthenticated visitors to login with return path", () => {
    const decision = checkAccess("/bookings", null, null);
    expect(decision).toEqual({
      status: "redirect",
      to: "/login?next=%2Fbookings",
    });
  });

  it("blocks suspended users immediately", () => {
    const suspendedUser: User = {
      ...verifiedAgentUser,
      accountStatus: "suspended",
    };
    const decision = checkAccess("/bookings", suspendedUser, approvedProfile);
    expect(decision).toEqual({
      status: "blocked",
      reason: "suspended",
    });
  });

  it("blocks non-partner roles (e.g. customer)", () => {
    const customerUser: User = {
      ...verifiedAgentUser,
      role: "customer" as unknown as "agent",
    };
    const decision = checkAccess("/bookings", customerUser, approvedProfile);
    expect(decision).toEqual({
      status: "blocked",
      reason: "role_mismatch",
    });
  });

  it("redirects users with incomplete profiles to complete-profile", () => {
    const incompleteUser: User = {
      ...verifiedAgentUser,
      profileComplete: false,
    };

    expect(checkAccess("/bookings", incompleteUser, approvedProfile)).toEqual({
      status: "redirect",
      to: "/complete-profile",
    });

    expect(checkAccess("/verification", incompleteUser, approvedProfile)).toEqual({
      status: "redirect",
      to: "/complete-profile",
    });

    expect(checkAccess("/profile", incompleteUser, approvedProfile)).toEqual({
      status: "redirect",
      to: "/complete-profile",
    });

    expect(checkAccess("/complete-profile", incompleteUser, approvedProfile)).toEqual({
      status: "allow",
    });
  });

  it("redirects users with unverified emails to verify-email", () => {
    const unverifiedUser: User = {
      ...verifiedAgentUser,
      isEmailVerified: false,
    };
    const decision = checkAccess("/bookings", unverifiedUser, approvedProfile);
    expect(decision).toEqual({
      status: "redirect",
      to: "/verify-email",
    });

    const onVerifyPage = checkAccess("/verify-email", unverifiedUser, approvedProfile);
    expect(onVerifyPage).toEqual({ status: "allow" });
  });

  it("blocks unapproved partners from restricted vehicle and booking routes", () => {
    const pendingProfile: PublisherProfile = {
      ...approvedProfile,
      verificationStatus: "pending",
    };

    expect(checkAccess("/vehicles", verifiedAgentUser, pendingProfile)).toEqual({
      status: "blocked",
      reason: "verification_required",
    });

    expect(checkAccess("/bookings", verifiedAgentUser, pendingProfile)).toEqual({
      status: "blocked",
      reason: "verification_required",
    });

    expect(checkAccess("/schedule", verifiedAgentUser, pendingProfile)).toEqual({
      status: "blocked",
      reason: "verification_required",
    });

    // Verification and profile pages are allowed
    expect(checkAccess("/verification", verifiedAgentUser, pendingProfile)).toEqual({
      status: "allow",
    });
    expect(checkAccess("/profile", verifiedAgentUser, pendingProfile)).toEqual({
      status: "allow",
    });
  });

  it("allows approved partners on all routes", () => {
    expect(checkAccess("/bookings", verifiedAgentUser, approvedProfile)).toEqual({
      status: "allow",
    });
    expect(checkAccess("/vehicles", verifiedAgentUser, approvedProfile)).toEqual({
      status: "allow",
    });
  });
});
