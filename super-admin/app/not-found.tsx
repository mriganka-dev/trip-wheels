import Link from "next/link";

export const metadata = {
  title: "Page not found",
  description: "The requested console page does not exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-line rounded p-8 text-center">
        <h1 className="text-xl font-semibold text-ink">Page not found</h1>
        <p className="text-sm text-ink-soft mt-2 mb-6">
          The console page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          Return to Today
        </Link>
      </div>
    </div>
  );
}
