"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getMyIssues } from "@/lib/api/issues";
import { queryKeys } from "@/lib/query-keys";
import { ISSUE_STATUS_CONFIG, ISSUE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Issue } from "@/types/issue";

export default function IssuesListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.issues.mine({ status: statusFilter === "all" ? undefined : statusFilter }),
    queryFn: () =>
      getMyIssues(1, 50, statusFilter === "all" ? undefined : statusFilter),
  });

  const issues: Issue[] = data?.items || [];

  return (
    <div className="py-8 sm:py-12">
      <Container size="default">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              My Reported Issues
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Track disputes, vehicle mismatch reports, and resolution updates.
            </p>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-line bg-paper-card p-1 text-xs">
            {["all", "open", "under_review", "resolved", "dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1 font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-brand text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load issues"
            message={error instanceof Error ? error.message : "Unable to retrieve your issues."}
            onRetry={() => refetch()}
          />
        ) : issues.length === 0 ? (
          <EmptyState
            title="No issues found"
            description="You have no reported issues. If something does not match during vehicle pickup, you can report it directly from your booking details."
            actionLabel="View My Bookings"
            onAction={() => {
              router.push("/bookings");
            }}
          />
        ) : (
          <div className="rounded-lg border border-line bg-paper-card divide-y divide-line overflow-hidden">
            {issues.map((issue) => {
              const statusMeta = ISSUE_STATUS_CONFIG[issue.status] || {
                label: issue.status,
                tone: "neutral" as const,
              };
              const typeLabel = ISSUE_TYPE_LABELS[issue.type] || issue.type;

              return (
                <Link
                  key={issue._id}
                  href={`/issues/${issue._id}`}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-paper-light transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">
                        {typeLabel}
                      </span>
                      <span className="text-ink-muted text-xs">•</span>
                      <span className="font-mono text-xs font-medium text-brand">
                        Booking {issue.booking?.bookingCode || "Booking"}
                      </span>
                    </div>

                    <p className="text-xs text-ink-muted line-clamp-1 max-w-xl">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-ink-muted">
                      {formatDate(issue.createdAt)}
                    </span>
                    <Badge tone={statusMeta.tone}>
                      {statusMeta.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
