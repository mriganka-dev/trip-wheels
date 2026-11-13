import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";
import { serverGetActiveDestinations } from "@/lib/api/destinations";
import { MapPin, ArrowRight, ShieldAlert } from "lucide-react";
import type { Destination } from "@/types/destination";

export default async function HomePage() {
  let destinations: Destination[] = [];
  try {
    destinations = await serverGetActiveDestinations();
  } catch {
    destinations = [];
  }

  // Check which destinations have real photos supplied on disk
  const destinationsWithPhotoStatus = destinations.map((d) => {
    const photoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "destinations",
      `${d.slug}.jpg`
    );
    return {
      ...d,
      hasPhoto: fs.existsSync(photoPath),
    };
  });

  return (
    <main className="py-10 md:py-14 bg-(--paper)">
      <Container>
        {/* Section 1: Hero heading, one sentence, and the search form */}
        <section className="mb-14 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Local travel vehicle rentals
          </span>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold font-display text-(--ink) tracking-tight leading-tight">
            Bikes and cars at your destination from local owners and rental shops.
          </h1>
          <p className="mt-3 text-base sm:text-lg text-(--ink-soft) leading-relaxed">
            Request a vehicle before leaving home so you do not waste time searching on arrival. No online advance payment: pay the owner directly when you inspect and collect the vehicle.
          </p>

          <div className="mt-8">
            <SearchForm destinations={destinations} />
          </div>
        </section>

        {/* Section 2: Destinations text list */}
        <section className="mb-16 border-t border-(--line) pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
                Explore regions
              </span>
              <h2 className="mt-1 text-2xl font-bold font-display text-(--ink)">
                Available destinations
              </h2>
            </div>
            <Link
              href="/destinations"
              className="text-xs font-semibold text-(--brand) hover:text-(--brand-dark) inline-flex items-center gap-1"
            >
              <span>All destinations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {destinationsWithPhotoStatus.length === 0 ? (
            <div className="rounded-md border border-(--line) bg-(--surface) p-6 text-center text-xs text-(--ink-soft)">
              Connecting to destinations database...
            </div>
          ) : (
            <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
              {destinationsWithPhotoStatus.map((dest) => {
                const landmarkNames = dest.landmarks
                  ?.slice(0, 3)
                  .map((lm) => lm.name)
                  .join(", ");

                return (
                  <div
                    key={dest.slug}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-(--paper)/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {dest.hasPhoto && (
                        <div className="relative w-20 h-16 rounded overflow-hidden shrink-0 border border-(--line)">
                          <Image
                            src={`/images/destinations/${dest.slug}.jpg`}
                            alt={`${dest.name}, ${dest.state}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-(--brand)" />
                          <h3 className="font-display text-base font-bold text-(--ink)">
                            <Link
                              href={`/destinations/${dest.slug}`}
                              className="hover:text-(--brand)"
                            >
                              {dest.name}
                            </Link>
                          </h3>
                          <span className="text-xs text-(--ink-soft)">
                            ({dest.state})
                          </span>
                        </div>
                        {landmarkNames && (
                          <p className="mt-1 text-xs text-(--ink-soft) sm:pl-6">
                            Main landmarks: {landmarkNames}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/destinations/${dest.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-(--brand) hover:text-(--brand-dark) sm:self-center shrink-0"
                    >
                      <span>Find vehicles</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: How booking works (numbered vertical list with large numerals) */}
        <section className="mb-16 border-t border-(--line) pt-12">
          <div className="max-w-xl mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
              Simple Process
            </span>
            <h2 className="mt-1 text-2xl font-bold font-display text-(--ink)">
              How booking works
            </h2>
            <p className="mt-1 text-xs text-(--ink-soft)">
              Four straightforward steps to secure your ride without advance payment.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-6">
              <span className="font-display text-4xl sm:text-5xl font-bold text-(--brand) shrink-0 select-none">
                01
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-(--ink)">
                  Search destination and dates
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                  Enter your travel destination and exact trip duration. View real photos, daily rates, fuel policy and reliability scores for verified bikes and cars.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-6">
              <span className="font-display text-4xl sm:text-5xl font-bold text-(--brand) shrink-0 select-none">
                02
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-(--ink)">
                  Send a booking request
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                  Submit a request to book. The publisher receives notification immediately and confirms within a set time window. You can browse alternative vehicles while waiting.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-6">
              <span className="font-display text-4xl sm:text-5xl font-bold text-(--brand) shrink-0 select-none">
                03
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-(--ink)">
                  The owner confirms
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                  Once confirmed, the publisher contact number and exact pickup location are shared. You receive real time status updates in your account.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-6">
              <span className="font-display text-4xl sm:text-5xl font-bold text-(--brand) shrink-0 select-none">
                04
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-(--ink)">
                  Pick up and pay the owner
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-(--ink-soft) leading-relaxed">
                  Meet at the pickup point, present your ID and driving license, inspect the vehicle, and settle the payment directly with the owner.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: What to carry */}
        <section className="mb-14 border-t border-(--line) pt-12">
          <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--brand) mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Mandatory Checklist</span>
            </div>
            <h2 className="font-display text-xl font-bold text-(--ink) mb-3">
              What to carry for handover
            </h2>
            <p className="text-xs sm:text-sm text-(--ink-soft) leading-relaxed mb-4">
              To ensure safety and legal compliance across all states, physical verification is carried out at pickup:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-(--ink) list-disc pl-5 mb-4">
              <li>
                <strong>Valid Government ID:</strong> Original Aadhaar card, Passport, or Voter ID proof.
              </li>
              <li>
                <strong>Valid Driving License:</strong> Original physical driving license for the appropriate vehicle category.
              </li>
            </ul>
            <p className="text-xs text-(--negative) font-medium bg-red-50 border border-red-200 p-3 rounded-md">
              Important: The vehicle publisher or rental shop can refuse vehicle handover without these physical documents.
            </p>
          </div>
        </section>

        {/* Section 5: Closing line linking to Help */}
        <section className="border-t border-(--line) pt-8 pb-4 text-center sm:text-left text-xs text-(--ink-soft) flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p>
            Have questions about deposit rules, fuel policy or cancellations?
          </p>
          <Link
            href="/help"
            className="font-semibold text-(--brand) hover:text-(--brand-dark) underline underline-offset-2 shrink-0"
          >
            Read our traveler FAQ in the Help center
          </Link>
        </section>
      </Container>
    </main>
  );
}
