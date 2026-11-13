import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Frequently asked questions about documents, booking confirmations, cancellations and vehicle handovers on Trip Wheels.",
};

const FAQS = [
  {
    question: "What documents must I carry to pick up a vehicle?",
    answer:
      "You must carry your original valid Indian driving license and an original government ID proof (Aadhaar, Voter ID or Passport). Learning licenses, photocopies and phone screenshots are not accepted. The owner can refuse vehicle handover without these physical documents.",
  },
  {
    question: "How does payment work?",
    answer:
      "There is no online payment on this platform. You do not enter any card details. You pay the rental shop or individual owner directly when you meet, inspect the vehicle and collect the keys. Prices listed on the site are clear and informational.",
  },
  {
    question: "What happens if the owner does not reply to my request?",
    answer:
      "Every booking request has a response deadline. If an owner does not respond within that timeframe, the request automatically expires. You are notified immediately, and alternative available vehicles for your dates will be shown.",
  },
  {
    question: "Can I cancel a booking request?",
    answer:
      "Yes. You can cancel any pending request before the owner accepts it. After confirmation, you can cancel up to the free cancellation window stated on the vehicle listing. You can manage cancellations directly from your My Bookings section.",
  },
  {
    question: "What should I do if the vehicle does not match the description?",
    answer:
      "Inspect the vehicle thoroughly before accepting keys and completing payment. If the vehicle condition, registration or model does not match the confirmed details, decline the handover immediately and report an issue from your booking page with photos.",
  },
  {
    question: "When is the owner contact number and exact address shared?",
    answer:
      "To protect privacy and ensure fair communication, the owner's phone number and the exact pickup address (for individual owners) are revealed once the owner confirms your booking request.",
  },
];

export default function HelpPage() {
  return (
    <main className="py-12 bg-(--paper) min-h-screen">
      <Container size="narrow">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Support & Information
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold font-display text-(--ink)">
            Help and Frequently Asked Questions
          </h1>
          <p className="mt-2 text-sm text-(--ink-soft) leading-relaxed">
            Find answers to common questions about booking requests, document verification and vehicle pickup rules on {APP_NAME}.
          </p>
        </div>

        <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
          {FAQS.map((faq, index) => (
            <div key={index} className="p-6">
              <h2 className="font-display text-base font-bold text-(--ink)">
                {faq.question}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-md border border-(--line) bg-(--surface) p-6 text-center">
          <h3 className="font-display text-base font-bold text-(--ink)">
            Need more assistance?
          </h3>
          <p className="mt-1 text-xs text-(--ink-soft) max-w-sm mx-auto">
            If you have an active booking issue, you can raise a ticket directly through your booking details.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center font-medium rounded-md px-4 py-2 text-xs bg-(--brand) text-white hover:bg-(--brand-dark) transition-colors"
            >
              Go to my bookings
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

