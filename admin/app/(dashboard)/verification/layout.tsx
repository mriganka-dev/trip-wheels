import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification",
};

export default function VerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
