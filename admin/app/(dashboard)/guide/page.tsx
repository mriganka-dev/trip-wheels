"use client";

import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { env } from "@/lib/env";

export default function GuidePage() {
  const supportEmail = env.supportEmail || "support@tripwheels.in";

  return (
    <AppShell
      title="Owner Guide & Rules"
      subtitle="Operational handbook and marketplace policies for rental partners"
    >
      <div className="space-y-6 max-w-3xl">
        <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft)">
          This guide outlines how the Trip Wheels marketplace works for rental shops and individual vehicle owners. Following these standards keeps your reliability score high and helps your vehicles appear prominently in destination searches.
        </div>

        {/* 1. How a booking works */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            1. How a booking works
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Trip Wheels operates strictly on a request-first model:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-(--ink-soft)">
              <li>
                <strong>Customer request:</strong> A traveler requests dates and a vehicle model.
              </li>
              <li>
                <strong>You reply in time:</strong> You accept or decline before the response deadline.
              </li>
              <li>
                <strong>Confirm vehicle:</strong> About 24 hours before pickup you confirm the exact registration and chassis numbers.
              </li>
              <li>
                <strong>Handover:</strong> At pickup you verify the customer government ID and driving license, then hand over the keys.
              </li>
              <li>
                <strong>Completion:</strong> When the vehicle is returned in good order, you mark the trip complete.
              </li>
            </ol>
          </div>
        </section>

        {/* 2. Reply times */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            2. Reply times
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Every new booking request displays a live countdown timer. You must respond before this deadline passes.
            </p>
            <p className="text-(--ink-soft)">
              If you do not reply before the deadline, the request expires automatically. The customer is notified and shown alternative vehicles. Letting requests expire without a reply directly lowers your reliability score.
            </p>
          </div>
        </section>

        {/* 3. Confirming the exact vehicle */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            3. Confirming the exact vehicle about 24 hours before pickup
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Travelers book a vehicle model, but need the exact registration and chassis number to locate the vehicle and verify documents at pickup.
            </p>
            <p className="text-(--ink-soft)">
              You must confirm the registration number, chassis number, color, and any handover notes about 24 hours before pickup. If this deadline is missed, the customer receives an alert and your reliability score is penalized.
            </p>
          </div>
        </section>

        {/* 4. Telling the customer in time when a vehicle cannot be provided */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            4. Telling the customer in time when a vehicle cannot be provided
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              If a vehicle is damaged, in service, or rented elsewhere, report it immediately through the &quot;This vehicle is not available&quot; action on the booking page.
            </p>
            <p className="text-(--ink-soft)">
              You must report unavailability at least 24 hours before pickup. If you report it later, it counts as a late disclosure and affects your score. If you fail to report it and the customer discovers it upon arrival, it counts as a serious platform failure resulting in immediate account review.
            </p>
          </div>
        </section>

        {/* 5. What to check at handover */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            5. What to check at handover
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              When the customer arrives for pickup, you must complete the mandatory checklist:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-(--ink-soft)">
              <li>
                Check the customer&apos;s physical government ID and ensure the full name matches the booking.
              </li>
              <li>
                Check a valid, unexpired driving license suitable for the vehicle type (bike or car).
              </li>
            </ul>
            <p className="text-(--ink-soft)">
              You have the full right to decline handover if the ID or license is missing, expired, or does not match. Declining handover for valid security or documentation reasons is recorded for the Admin team and does not penalize your reliability score.
            </p>
          </div>
        </section>

        {/* 6. Payment */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            6. Payment
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Trip Wheels does not process rental transactions or collect customer payments.
            </p>
            <p className="text-(--ink-soft)">
              You collect the rental fee and any refundable security deposit directly from the customer at pickup using your preferred payment method (cash, UPI, or card). All price figures shown in the app are informational estimates based on your listing rates.
            </p>
          </div>
        </section>

        {/* 7. Pickup location */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            7. Pickup location
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Pickup arrangements depend on your partner account type:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-(--ink-soft)">
              <li>
                <strong>Rental agents:</strong> Customers pick up vehicles at your registered physical shop address and map pin.
              </li>
              <li>
                <strong>Individual owners:</strong> You agree the exact meeting point with the customer by phone after accepting the request, then save the address and map pin on the booking page.
              </li>
            </ul>
          </div>
        </section>

        {/* 8. Cancelling, no-shows and late returns */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            8. Cancelling, no-shows and late returns
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Operational exceptions:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-(--ink-soft)">
              <li>
                <strong>Owner cancellation:</strong> Cancelling a confirmed booking lowers your reliability score. Only cancel when strictly unavoidable.
              </li>
              <li>
                <strong>Customer no-show:</strong> If a customer fails to arrive within 120 minutes of the pickup time, you can mark the booking as a no-show.
              </li>
              <li>
                <strong>Late returns:</strong> If a customer returns a vehicle significantly late, you can report an issue through the Issues section to request platform intervention.
              </li>
            </ul>
          </div>
        </section>

        {/* 9. Reliability score */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-2">
          <h2 className="text-base font-semibold text-(--ink)">
            9. Reliability score
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              Your reliability score starts at 100. It increases with fast replies, timely vehicle confirmations, and successful trip completions.
            </p>
            <p className="text-(--ink-soft)">
              A higher score helps your vehicles appear higher in search results. A low score can lead to a warning and a review by our team. You can monitor your operational counters anytime on the{" "}
              <Link href="/reliability" className="text-(--brand) underline">
                Reliability page
              </Link>.
            </p>
          </div>
        </section>

        {/* 10. Who to contact */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-3">
          <h2 className="text-base font-semibold text-(--ink)">
            10. Who to contact
          </h2>
          <div className="text-xs text-(--ink) space-y-2 leading-relaxed">
            <p>
              If you experience an unresolved dispute, technical problem, or verification question, reach out to our team:
            </p>
            <div className="flex items-center gap-2 pt-1 font-medium text-(--brand)">
              <Mail className="w-4 h-4" />
              <a href={`mailto:${supportEmail}`} className="hover:underline">
                {supportEmail}
              </a>
            </div>
            <p className="text-[11px] text-(--ink-soft)">
              Our partner support desk operates during regular business hours to assist with account and trip verification matters.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
