import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business details",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
