"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DefinitionList } from "@/components/ui/definition-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function ReliabilityPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppShell title="Reliability & Performance">
        <div className="space-y-6">
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </AppShell>
    );
  }

  const reliability = profile?.reliability || {
    score: 100,
    requestsReceived: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    completed: 0,
    cancelledAfterConfirm: 0,
    noShows: 0,
    lateDisclosures: 0,
    missedConfirmations: 0,
    issuesUpheld: 0,
    avgResponseMinutes: 0,
    undisclosedUnavailability: 0,
  };

  const score = reliability.score ?? 100;

  const definitionItems = [
    {
      key: "requestsReceived",
      label: "Requests received",
      value: reliability.requestsReceived || 0,
    },
    {
      key: "accepted",
      label: "Accepted requests",
      value: reliability.accepted || 0,
    },
    {
      key: "rejected",
      label: "Declined requests",
      value: reliability.rejected || 0,
    },
    {
      key: "expired",
      label: "Expired requests",
      value: reliability.expired || 0,
    },
    {
      key: "completed",
      label: "Completed trips",
      value: reliability.completed || 0,
    },
    {
      key: "cancelledAfterConfirm",
      label: "Cancelled after confirmation",
      value: reliability.cancelledAfterConfirm || 0,
    },
    {
      key: "noShows",
      label: "Customer no-shows recorded",
      value: reliability.noShows || 0,
    },
    {
      key: "lateDisclosures",
      label: "Late unavailability disclosures",
      value: reliability.lateDisclosures || 0,
    },
    {
      key: "missedConfirmations",
      label: "Missed vehicle confirmation deadlines",
      value: reliability.missedConfirmations || 0,
    },
    {
      key: "issuesUpheld",
      label: "Issues upheld against you",
      value: reliability.issuesUpheld || 0,
    },
    {
      key: "avgResponseMinutes",
      label: "Average response time",
      value:
        reliability.avgResponseMinutes && reliability.avgResponseMinutes > 0
          ? `${Math.round(reliability.avgResponseMinutes)} minutes`
          : "Under 15 minutes",
    },
  ];

  return (
    <AppShell
      title="Reliability & Performance"
      subtitle="Understand your standing and platform reliability score"
    >
      <div className="space-y-6">
        {/* Score Header Card */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-(--ink-soft)">
                Your reliability score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold font-display text-(--brand)">
                  {score}
                </span>
                <span className="text-sm text-(--ink-soft)">/ 100</span>
              </div>
              <p className="text-xs text-(--ink-soft) mt-1">
                Based on your operational discipline, response rate, and trip completions.
              </p>
            </div>

            {score < 70 ? (
              <div className="rounded border border-rose-300 bg-rose-50 p-3 flex items-start gap-2.5 text-xs text-rose-900 max-w-md">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                <span>
                  Your score is below platform standards. Continued drops may lead to account review and temporary listing suspension.
                </span>
              </div>
            ) : score < 85 ? (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5 text-xs text-amber-900 max-w-md">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Your score is satisfactory, but prompt replies and timely vehicle confirmations will improve your vehicle search ranking.
                </span>
              </div>
            ) : (
              <div className="rounded border border-(--brand)/20 bg-(--brand)/5 p-3 flex items-start gap-2.5 text-xs text-(--ink) max-w-md">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-(--brand)" />
                <span>
                  Excellent performance. Your vehicles receive priority placement in destination search results.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Operational Counters */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6">
          <h2 className="text-base font-semibold text-(--ink) pb-3 border-b border-(--line)">
            Operational activity counters
          </h2>
          <div className="mt-4">
            <DefinitionList items={definitionItems} />
          </div>
        </section>

        {/* What affects your score */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-6">
          <div className="pb-3 border-b border-(--line)">
            <h2 className="text-base font-semibold text-(--ink)">
              What affects your score
            </h2>
            <p className="text-xs text-(--ink-soft) mt-0.5">
              Clear rules on how operational actions impact your partner standing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded border border-(--line) bg-(--surface-soft) p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-(--brand) flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                What raises your score
              </h3>
              <ul className="text-xs text-(--ink) space-y-2 list-disc pl-4">
                <li>Replying to booking requests within the response window</li>
                <li>Confirming exact vehicle details on time (about 24 hours before pickup)</li>
                <li>Completing scheduled trips reliably without customer disputes</li>
                <li>Conducting thorough handover identity and license checks</li>
              </ul>
            </div>

            <div className="rounded border border-(--line) bg-(--surface-soft) p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                What lowers your score
              </h3>
              <ul className="text-xs text-(--ink) space-y-2 list-disc pl-4">
                <li>Letting booking requests expire without a response</li>
                <li>Cancelling confirmed bookings</li>
                <li>Missing the mandatory 24-hour exact vehicle confirmation</li>
                <li>Reporting vehicle unavailability late (less than 24 hours before pickup)</li>
                <li>Having a customer dispute or damage issue upheld against you</li>
                <li>Failing to disclose vehicle unavailability before customer arrives</li>
              </ul>
            </div>
          </div>

          <div className="rounded border border-(--line) bg-(--paper) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-semibold text-(--ink)">Search ranking and visibility</p>
            <p>
              A higher score helps your vehicles appear higher in search results. A low score can lead to a warning and a review by our team.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
