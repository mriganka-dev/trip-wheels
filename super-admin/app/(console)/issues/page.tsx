"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import { getAdminIssues } from "@/lib/api/issues";
import {
  getIssueStatusMeta,
  getIssueTypeLabel,
  getSeverityMeta,
  ISSUE_TYPE_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatWaitingFor } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { AdminIssueItem } from "@/types/issues";

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_WEIGHT: Record<string, number> = {
  open: 3,
  under_review: 2,
  resolved: 1,
  dismissed: 0,
};

export default function IssuesListPage() {
  usePageTitle("Issues");
  const searchParams = useSearchParams();

  const initialStatus = searchParams?.get("status") || "active";
  const initialSearch = searchParams?.get("search") || "";

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [page, setPage] = useState<number>(1);

  // Issues list query (refetch every 60s)
  const issuesQuery = useQuery({
    queryKey: queryKeys.issues.list({
      status: statusFilter,
      type: typeFilter,
      severity: severityFilter,
      from: fromDate,
      to: toDate,
      page,
      limit: 20,
    }),
    queryFn: () =>
      getAdminIssues({
        status: statusFilter === "active" ? undefined : statusFilter,
        type: typeFilter,
        severity: severityFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit: 20,
      }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const issuesData = issuesQuery.data;
  const totalItems = issuesData?.totalItems || 0;
  const totalPages = issuesData?.totalPages || 1;
  const limit = issuesData?.limit || 20;

  // Filter client-side when needed:
  // 1) "active" preset filters for open and under_review
  // 2) Client-side text search (bookingCode or party names)
  // 3) Date filtering if backend doesn't handle range directly
  const filteredAndSortedItems = useMemo(() => {
    let result = [...(issuesData?.items || [])];

    if (statusFilter === "active") {
      result = result.filter(
        (item) => item.status === "open" || item.status === "under_review"
      );
    }

    if (fromDate) {
      const fromTime = new Date(fromDate).getTime();
      result = result.filter(
        (item) => new Date(item.createdAt).getTime() >= fromTime
      );
    }

    if (toDate) {
      const toTime = new Date(toDate).setHours(23, 59, 59, 999);
      result = result.filter(
        (item) => new Date(item.createdAt).getTime() <= toTime
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const code = item.booking?.bookingCode?.toLowerCase() || "";
        const raisedBy = item.raisedBy?.fullName?.toLowerCase() || "";
        const raisedAgainst = item.raisedAgainst?.fullName?.toLowerCase() || "";
        const desc = item.description?.toLowerCase() || "";
        return (
          code.includes(q) ||
          raisedBy.includes(q) ||
          raisedAgainst.includes(q) ||
          desc.includes(q)
        );
      });
    }

    // Default sorting: Open/Under review first, then most severe first, then newest
    result.sort((a, b) => {
      const statusDiff = (STATUS_WEIGHT[b.status] || 0) - (STATUS_WEIGHT[a.status] || 0);
      if (statusDiff !== 0) return statusDiff;

      const severityDiff =
        (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [issuesData?.items, statusFilter, fromDate, toDate, searchQuery]);

  const columns: Column<AdminIssueItem>[] = [
    {
      key: "type",
      header: "Type & Severity",
      render: (item: AdminIssueItem) => {
        const sevMeta = getSeverityMeta(item.severity);
        return (
          <div className="space-y-1">
            <span className="font-semibold text-ink block text-xs">
              {getIssueTypeLabel(item.type)}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge tone={sevMeta.tone}>{sevMeta.label}</Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: "booking",
      header: "Booking Code",
      render: (item: AdminIssueItem) => {
        if (!item.booking) {
          return <span className="text-ink-soft text-xs">No booking</span>;
        }
        return (
          <Link
            href={`/bookings/${item.booking._id}`}
            className="font-mono text-xs font-bold text-brand hover:underline"
          >
            {item.booking.bookingCode || item.booking._id}
          </Link>
        );
      },
    },
    {
      key: "raisedBy",
      header: "Raised By",
      render: (item: AdminIssueItem) => (
        <div className="text-xs">
          <p className="font-semibold text-ink">
            {item.raisedBy?.fullName || "Unknown"}
          </p>
          <p className="text-ink-soft text-[11px] truncate max-w-[150px]">
            {item.raisedBy?.email}
          </p>
        </div>
      ),
    },
    {
      key: "raisedAgainst",
      header: "Raised Against",
      render: (item: AdminIssueItem) => (
        <div className="text-xs">
          <p className="font-semibold text-ink">
            {item.raisedAgainst?.fullName || "Unknown"}
          </p>
          <p className="text-ink-soft text-[11px] truncate max-w-[150px]">
            {item.raisedAgainst?.email}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: AdminIssueItem) => {
        const meta = getIssueStatusMeta(item.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Created & Open Duration",
      render: (item: AdminIssueItem) => {
        const isOpen = item.status === "open" || item.status === "under_review";
        return (
          <div className="text-xs space-y-0.5">
            <p className="text-ink font-medium">{formatDateTime(item.createdAt)}</p>
            {isOpen ? (
              <p className="text-warning font-semibold text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Open for {formatWaitingFor(item.createdAt)}
              </p>
            ) : (
              <p className="text-ink-soft text-[11px]">Closed</p>
            )}
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (item: AdminIssueItem) => (
        <Link
          href={`/issues/${item._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <span>Review</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Issues"
      contextLine="Review reports raised by customers and owners, verify evidence, and record decisions."
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <FilterBar>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 w-full">
            {/* Status Filter */}
            <div>
              <label htmlFor="issue-status-filter" className="block text-xs font-semibold text-ink-soft mb-1">
                Status
              </label>
              <Select
                id="issue-status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "Open & Under review (Default)", value: "active" },
                  { label: "All Statuses", value: "all" },
                  { label: "Open", value: "open" },
                  { label: "Under review", value: "under_review" },
                  { label: "Resolved", value: "resolved" },
                  { label: "Dismissed", value: "dismissed" },
                ]}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="issue-type-filter" className="block text-xs font-semibold text-ink-soft mb-1">
                Type
              </label>
              <Select
                id="issue-type-filter"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "All Types", value: "all" },
                  ...Object.keys(ISSUE_TYPE_LABELS).map((t) => ({
                    label: ISSUE_TYPE_LABELS[t],
                    value: t,
                  })),
                ]}
              />
            </div>

            {/* Severity Filter */}
            <div>
              <label htmlFor="issue-severity-filter" className="block text-xs font-semibold text-ink-soft mb-1">
                Severity
              </label>
              <Select
                id="issue-severity-filter"
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "All Severities", value: "all" },
                  { label: "Critical", value: "critical" },
                  { label: "High", value: "high" },
                  { label: "Medium", value: "medium" },
                  { label: "Low", value: "low" },
                ]}
              />
            </div>

            {/* Date Range From */}
            <div>
              <label htmlFor="issue-from-date" className="block text-xs font-semibold text-ink-soft mb-1">
                From Date
              </label>
              <Input
                id="issue-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Date Range To */}
            <div>
              <label htmlFor="issue-to-date" className="block text-xs font-semibold text-ink-soft mb-1">
                To Date
              </label>
              <Input
                id="issue-to-date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Search by booking code or name */}
          <div className="w-full pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by booking code, raised by name, raised against name, or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </FilterBar>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredAndSortedItems}
          keyExtractor={(item) => item._id}
          isLoading={issuesQuery.isLoading}
          emptyMessage="No issues match this view. Try adjusting the status, type, severity, date range, or search keywords."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            limit={limit}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
