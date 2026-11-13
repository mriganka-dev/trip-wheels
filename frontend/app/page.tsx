import Link from "next/link";
import { Container } from "@/components/layout/container";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="py-12 md:py-16">
      <Container>
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Local travel marketplace
          </span>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold font-display text-(--ink) tracking-tight leading-tight">
            Bikes and cars at your destination from local owners and rental shops.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-(--ink-soft) leading-relaxed">
            Request a vehicle before leaving home so you do not waste time searching on arrival. No online advance payment: pay the owner directly when you inspect and collect the vehicle.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/destinations"
              className="inline-flex items-center justify-center font-medium rounded-md px-5 py-2.5 text-sm bg-(--brand) text-white hover:bg-(--brand-dark) transition-colors"
            >
              Explore destinations
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center font-medium rounded-md px-5 py-2.5 text-sm border border-(--line) bg-(--surface) text-(--ink) hover:border-(--ink-soft) transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="mt-16 border-t border-(--line) pt-12">
          <h2 className="text-xl font-bold font-display text-(--ink)">
            How {APP_NAME} works
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <span className="font-display text-2xl font-bold text-(--brand)">
                01
              </span>
              <h3 className="font-semibold text-sm text-(--ink)">
                Choose your destination
              </h3>
              <p className="text-xs text-(--ink-soft) leading-relaxed">
                Filter bikes and cars by trip dates, transmission and fuel type. Review verified vehicle details and owner reliability scores.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-display text-2xl font-bold text-(--brand)">
                02
              </span>
              <h3 className="font-semibold text-sm text-(--ink)">
                Send a booking request
              </h3>
              <p className="text-xs text-(--ink-soft) leading-relaxed">
                The owner accepts or declines your request within a set time window. You receive notifications at every step.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-display text-2xl font-bold text-(--brand)">
                03
              </span>
              <h3 className="font-semibold text-sm text-(--ink)">
                Meet, verify and pay at pickup
              </h3>
              <p className="text-xs text-(--ink-soft) leading-relaxed">
                Show your driving license and government ID proof, inspect the vehicle, and settle payment directly with the owner.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
