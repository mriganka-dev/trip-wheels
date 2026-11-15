import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--paper) p-4">
      <div className="w-full max-w-md p-8 rounded-md border border-(--line) bg-(--surface) text-center">
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-(--ink-soft)">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="primary" size="md">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
