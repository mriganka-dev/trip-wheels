import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle details",
  description: "View vehicle specifications, status, pricing, uploaded documents and availability.",
};

export default function VehicleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
