import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your vehicles",
  description: "View and manage your registered vehicles, check verification status and set rental pricing.",
};

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
