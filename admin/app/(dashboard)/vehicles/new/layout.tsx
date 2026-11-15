import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a vehicle",
  description: "Set up basic details, pricing, photos and documents for a new vehicle.",
};

export default function NewVehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
