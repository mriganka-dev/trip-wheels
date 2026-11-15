import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Today",
  description: "Operations work queue and pending verification tasks.",
};

export default function TodayPage() {
  return (
    <AppShell
      title="Today"
      contextLine="Platform operations and pending reviews."
    >
      <div className="bg-surface border border-line rounded p-6">
        <h2 className="text-base font-semibold text-ink">Operations Console</h2>
        <p className="text-sm text-ink-soft mt-1">
          Welcome to the Trip Wheels Super Admin operations console. Work queues, verifications, and platform oversight are organized in the sidebar navigation.
        </p>
      </div>
    </AppShell>
  );
}
