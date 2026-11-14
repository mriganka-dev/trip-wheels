import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit vehicle",
  description: "Update specifications, photos, rental pricing or documents for this vehicle.",
};

export default function EditVehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
