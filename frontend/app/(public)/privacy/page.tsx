import React from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Privacy policy for Trip Wheels. Plain explanation of how we collect, store, and share traveler information.",
};

export default function PrivacyPage() {
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
              Privacy and Data Protection
            </span>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-bold text-ink">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Last updated: November 2026
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              1. Information We Collect
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              When you create an account or request a booking, we collect your full name, verified email address, phone number, and optional profile picture. When reporting issues, we collect the photos and descriptions you choose to provide.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              2. How We Share Contact Information
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              To protect traveler privacy, your direct contact details are never shared publicly. Your phone number is disclosed only to the confirmed vehicle owner once a booking request is accepted, ensuring coordination for vehicle handover.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              3. Payment Information
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              We never ask for, collect, store, or process credit card details, debit card numbers, UPI PINs, or net banking credentials. All payments are strictly offline between you and the vehicle owner.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              4. Device Notifications and Cookies
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              We use secure, HTTP-only session cookies solely for authentication and account protection. If you opt in to browser push notifications, we store your anonymous browser push endpoint to deliver booking status alerts. You can disable notifications anytime in your profile settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              5. Your Rights and Account Anonymization
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              You can review and update your profile information, manage your notification preferences, or request account closure at any time through your account settings or by contacting our support team.
            </p>
          </section>
        </article>
      </Container>
    </div>
  );
}

