import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Learn how Trip Wheels connects travelers with local bike and car owners through request-based booking and direct pickup payment.",
};

const STEPS = [
  {
    number: "01",
    title: "Choose your destination and trip dates",
    description:
      "Select your travel destination, pickup time and return time. Filter vehicles by category, transmission, fuel type and proximity to key landmarks such as railway stations or beaches.",
  },
  {
    number: "02",
    title: "Send a booking request",
    description:
      "When you find a vehicle that fits your plan, submit a request. The vehicle owner receives your request immediately and has a fixed window to accept or decline it.",
  },
  {
    number: "03",
    title: "Wait for owner confirmation",
    description:
      "You receive notifications as soon as the owner responds. If an owner is unable to accept, alternative matching vehicles are suggested right away.",
  },
  {
    number: "04",
    title: "Inspect, verify documents and pay at pickup",
    description:
      "Meet the owner or rental shop at the pickup location. Show your valid driving license and government ID proof, check the vehicle condition, and settle payment directly. No online payment is processed on this website.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="py-12 bg-(--paper) min-h-screen">
      <Container size="narrow">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Simple and Direct
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold font-display text-(--ink)">
            How {APP_NAME} works
          </h1>
          <p className="mt-3 text-sm text-(--ink-soft) leading-relaxed">
            {APP_NAME} is built around honest local travel. We do not hold your money or add hidden card checkout fees. You request a vehicle in advance and pay the owner in person.
          </p>
        </div>

        <div className="space-y-6">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6"
            >
              <span className="font-display text-4xl sm:text-5xl font-bold text-(--brand) shrink-0 select-none">
                {step.number}
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-(--ink)">
                  {step.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-(--ink) mb-3">
            Important requirements for every renter
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
            <p>
              <strong>Original Driving License:</strong> You must present an original, physically valid driving license appropriate for the vehicle category (motorcycle with gear, gearless scooter or light motor vehicle).
            </p>
            <p>
              <strong>Government ID Proof:</strong> You must carry an original government identification document (Aadhaar Card, Passport, or Voter ID).
            </p>
            <p>
              <strong>Owner Discretion:</strong> Owners and rental shops are legally required to verify documentation and may refuse handover if valid credentials are not presented.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-(--line) flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-(--ink-soft)">
              Have more questions about rentals or cancellations?
            </span>
            <Link
              href="/help"
              className="inline-flex items-center justify-center font-medium rounded-md px-4 py-2 text-xs bg-(--brand) text-white hover:bg-(--brand-dark) transition-colors"
            >
              Visit Help & FAQ
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

