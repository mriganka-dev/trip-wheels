import { notFound } from "next/navigation";
import { isProduction } from "@/lib/env";
import { StyleguideClient } from "./styleguide-client";

export const metadata = {
  title: "Styleguide",
  description: "Super Admin design system components styleguide.",
};

export default function StyleguidePage() {
  if (isProduction()) {
    notFound();
  }

  return <StyleguideClient />;
}
