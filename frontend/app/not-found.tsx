import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="py-20">
      <Container size="narrow">
        <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            404
          </p>
          <h1 className="mt-2 text-2xl font-bold font-display text-(--ink)">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-(--ink-soft) max-w-md mx-auto">
            The page you requested could not be found. It may have been moved, or the link may be outdated.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center font-medium rounded-md px-4 py-2 text-sm bg-(--brand) text-white hover:bg-(--brand-dark) transition-colors"
            >
              Return to home
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

