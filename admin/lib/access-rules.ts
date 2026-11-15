import type { PublisherProfile, User } from "@/types/auth";

export type AccessDecision =
  | { status: "allow" }
  | { status: "redirect"; to: string }
  | { status: "blocked"; reason: "role_mismatch" | "suspended" | "verification_required" };

const VERIFICATION_REQUIRED_PREFIXES = [
  "/vehicles",
  "/bookings",
  "/schedule",
];

export function checkAccess(
  pathname: string,
  user: User | null,
  profile: PublisherProfile | null
): AccessDecision {
  if (!user) {
    const encoded = encodeURIComponent(pathname);
    return { status: "redirect", to: `/login?next=${encoded}` };
  }

  // 1. Account status suspended check
  if (user.accountStatus === "suspended" || profile?.verificationStatus === "suspended") {
    return { status: "blocked", reason: "suspended" };
  }

  // 2. Role check (only agent and individual are allowed in partner dashboard)
  if (user.role !== "agent" && user.role !== "individual") {
    return { status: "blocked", reason: "role_mismatch" };
  }

  // 3. Email verification check
  if (!user.isEmailVerified) {
    if (pathname === "/verify-email") {
      return { status: "allow" };
    }
    return { status: "redirect", to: "/verify-email" };
  }

  // 4. Verification state check
  const isApproved = profile?.verificationStatus === "approved";
  if (!isApproved) {
    const isRestricted = VERIFICATION_REQUIRED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isRestricted) {
      return { status: "blocked", reason: "verification_required" };
    }
  }

  return { status: "allow" };
}
