"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaiseIssueDialog } from "@/components/issues/raise-issue-dialog";
import { getMyIssues } from "@/lib/api/issues";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

const ISSUE_TYPE_LABELS: Record<string, string> = {
  customer_damage: "Customer damage",
  late_return: "Late return",
  customer_no_show: "Customer no-show",
  misconduct: "Misconduct",
  not_as_promised: "Dispute / not as promised",
  vehicle_mismatch: "Vehicle mismatch",
  chassis_mismatch: "Chassis mismatch",
  registration_mismatch: "Registration mismatch",
  vehicle_damage_undisclosed: "Undisclosed damage",
  vehicle_unavailable_at_pickup: "Vehicle unavailable",
};

export default function IssuesPage() {
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [page, setPage] = useState(1);
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);

  const limit = 15;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.issues.mine({ tab, page, limit }),
    queryFn: () => getMyIssues({ page, limit }),
  });

  const allItems = data?.items || [];

  // Filter open vs closed locally
  // Open: "open", "under_review"
  // Closed: "resolved", "dismissed"
  const filteredItems = allItems.filter((issue) => {
    if (tab === "open") {
      return issue.status === "open" || issue.status === "under_review";
    }
    return issue.status === "resolved" || issue.status === "dismissed";
  });

  const totalPages = data?.totalPages || 1;

  const getStatusTone = (status: string): "warning" | "neutral" | "brand" | "negative" => {
    if (status === "open") return "warning";
    if (status === "under_review") return "brand";
    if (status === "resolved") return "brand";
    return "neutral";
  };

  return (
    <AppShell
      title="Issues & Disputes"
      subtitle="Track reported issues, disputes, and resolutions"
      actions={
        <Button
          size="sm"
          onClick={() => setIsRaiseOpen(true)}
          className="bg-(--brand) hover:bg-(--brand-hover) text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Report an issue
        </Button>
      }
    >
      <div className="space-y-6">
        <Tabs
          value={tab}
          onValueChange={(newTab) => {
            setTab(newTab as "open" | "closed");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="open">Open issues</TabsTrigger>
            <TabsTrigger value="closed">Closed issues</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
            <p className="text-sm text-rose-800">
              Could not load issues. Please try again.
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={tab === "open" ? "No open issues" : "No closed issues"}
            description={
              tab === "open"
                ? "There are no unresolved issues on your account."
                : "You have no past resolved or dismissed issues."
            }
          />
        ) : (
          <div className="rounded-md border border-(--line) bg-(--surface) divide-y divide-(--line)">
            {filteredItems.map((issue) => {
              const typeLabel =
                ISSUE_TYPE_LABELS[issue.type] || issue.type.replace(/_/g, " ");

              return (
                <Link
                  key={issue._id}
                  href={`/issues/${issue._id}`}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-(--surface-soft) transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-(--ink)">
                        {typeLabel}
                      </span>
                      <Badge tone={getStatusTone(issue.status)}>
                        {issue.status.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs font-mono text-(--ink-soft)">
                        Booking: {issue.booking?.bookingCode || "N/A"}
                      </span>
                    </div>

                    <p className="text-xs text-(--ink-soft) line-clamp-1">
                      {issue.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-(--ink-soft) pt-1">
                      <span>Raised by: {issue.raisedBy?.fullName || "User"}</span>
                      <span>Date: {formatDateTime(issue.createdAt)}</span>
                      {issue.evidence && issue.evidence.length > 0 && (
                        <span>{issue.evidence.length} photos</span>
                      )}
                    </div>
                  </div>

                  <div className="text-(--ink-soft) shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <RaiseIssueDialog
        isOpen={isRaiseOpen}
        onClose={() => setIsRaiseOpen(false)}
        onSuccess={() => refetch()}
      />
    </AppShell>
  );
}
