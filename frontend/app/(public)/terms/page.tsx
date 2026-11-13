import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms of service for using Trip Wheels. Plain language explanation of our platform role, direct owner payments, and renter responsibilities.",
};

export default function TermsPage() {
  return (
    <div className="py-10 sm:py-16">
      <Container size="narrow">
        {/* Notice of draft legal text */}
        <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold block mb-0.5">
            Draft Document:
          </strong>
          This document is written in plain language for clarity and transparency. It represents draft terms that are subject to formal legal review.
        </div>

        <article className="prose prose-neutral max-w-none space-y-8 text-ink">
          <header className="border-b border-line pb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Legal Agreement
            </span>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-bold text-ink">
              Terms of Use
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Last updated: November 2026
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              1. Our Role as a Discovery and Connection Platform
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Trip Wheels operates solely as a technology platform connecting independent vehicle owners and registered local rental shops with travelers. We do not own, inspect, maintain, operate, or lease any vehicles listed on the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              2. Direct Offline Payment
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              No rental payments or deposits are collected or processed online by Trip Wheels. All rental charges, refundable security deposits, and fuel agreements are paid directly by the traveler to the vehicle owner at the time of vehicle handover via cash or UPI.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              3. Verification and Handover Responsibility
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Travelers must present original physical copies of their government photo ID and a valid driving license suited for the vehicle category. Vehicle owners hold full legal discretion to refuse handover if documents cannot be verified. Travelers must inspect the vehicle condition, registration plate, and chassis stamping before accepting the keys.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              4. Rental Liability, Accidents, and Damage
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Responsibility for the vehicle, safe driving practices, adherence to local traffic regulations, accidents, mechanical misuse, third-party liability, and physical damage is strictly between the traveler and the vehicle owner. Trip Wheels does not assume liability for any road incidents, injuries, losses, delays, or mechanical breakdowns.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              5. Cancellations and Modifications
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Each vehicle listing specifies a free cancellation window. Cancellation requests submitted within this window are free of penalty. Late cancellations or failure to collect the vehicle without prior notice will result in a recorded no-show on the customer account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              6. Dispute Support and Mediation
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              If an owner fails to provide the booked vehicle, or if the registration or condition materially differs from the listing, travelers should refuse vehicle acceptance and submit a report via our issue dispute flow. Our support team reviews reports to take appropriate corrective measures on owner accounts.
            </p>
          </section>
        </article>
      </Container>
    </div>
  );
}

