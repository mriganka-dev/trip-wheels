import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Today",
};

export default function HomePage() {
  return (
    <AppShell
      title="Today"
      subtitle="Overview of your rental operations, requests and handovers"
    >
      <div className="flex flex-col gap-6">
        <section className="p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">
            Needs your action
          </h2>
          <p className="mt-1 text-sm text-(--ink-soft)">
            No pending requests or urgent vehicle confirmations right now.
          </p>
        </section>

        <section className="p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">
            Today schedule
          </h2>
          <p className="mt-1 text-sm text-(--ink-soft)">
            No vehicle pick-ups or returns scheduled for today.
          </p>
        </section>

        <div className="pt-2">
          <p className="text-xs text-(--ink-soft)">
            Your partner account is active and in good standing.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
