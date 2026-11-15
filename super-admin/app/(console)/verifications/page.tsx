"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import { getDestinations } from "@/lib/api/destinations";
import { getVerifications } from "@/lib/api/verifications";
import { getVerificationStatusMeta } from "@/lib/constants";
import { formatDateOnly, formatWaitingFor } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { VerificationQueueItem } from "@/types/verifications";

export default function VerificationQueuePage() {
  usePageTitle("Verification Queue");
  const searchParams = useSearchParams();

  const initialStatus = searchParams?.get("status") || "pending";

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Destinations query for filter dropdown
  const destinationsQuery = useQuery({
    queryKey: queryKeys.destinations.all,
    queryFn: getDestinations,
  });

  // Verifications queue query
  const verificationsQuery = useQuery({
    queryKey: queryKeys.verifications.list({
      page,
      status: statusFilter,
      type: typeFilter,
      destination: destinationFilter,
      search: searchQuery,
    }),
    queryFn: () =>
      getVerifications({
        page,
        limit: 15,
        status: statusFilter,
        type: typeFilter,
        destination: destinationFilter,
        search: searchQuery,
      }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // Sort queue by oldest waiting first by default
  const sortedItems = useMemo(() => {
    const list = verificationsQuery.data?.items || [];
    return [...list].sort((a, b) => {
      const timeA = new Date(a.submittedAt || a.createdAt).getTime();
      const timeB = new Date(b.submittedAt || b.createdAt).getTime();
      return timeA - timeB;
    });
  }, [verificationsQuery.data?.items]);

  const destinationOptions = useMemo(() => {
    const defaultOpt = [{ label: "All Destinations", value: "all" }];
    const fetched = (destinationsQuery.data || []).map((d) => ({
      label: d.name,
      value: d._id,
    }));
    return [...defaultOpt, ...fetched];
  }, [destinationsQuery.data]);

  const columns: Column<VerificationQueueItem>[] = [
    {
      key: "owner",
      header: "Owner",
      render: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/verifications/${item._id}`}
            className="font-semibold text-ink hover:text-brand"
          >
            {item.user?.fullName || "Unnamed Owner"}
          </Link>
          <span className="text-xs text-ink-soft">
            {item.user?.email || item.user?.phone}
          </span>
          {item.businessName && (
            <span className="text-xs text-ink-soft italic">
              {item.businessName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => {
        const isAgent = item.publisherType === "agent";
        return (
          <Badge tone={isAgent ? "brand" : "neutral"}>
            {isAgent ? "Agent" : "Individual"}
          </Badge>
        );
      },
    },
    {
      key: "location",
      header: "Location",
      render: (item) => {
        const destName =
          typeof item.destination === "object"
            ? item.destination?.name
            : item.destination;
        const area = item.individualArea?.area;
        const city = item.individualArea?.city;

        return (
          <span className="text-sm text-ink-soft">
            {destName || city || area || "Not specified"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const meta = getVerificationStatusMeta(item.verificationStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (item) => (
        <span className="text-xs text-ink-soft">
          {formatDateOnly(item.submittedAt || item.createdAt)}
        </span>
      ),
    },
    {
      key: "waited",
      header: "Time waited",
      render: (item) => (
        <span className="text-xs font-medium text-ink">
          {formatWaitingFor(item.submittedAt || item.createdAt)}
        </span>
      ),
    },
    {
      key: "documents",
      header: "Documents",
      render: (item) => (
        <span className="text-xs text-ink-soft">
          {item.documents?.length || 0} docs
        </span>
      ),
    },
    {
      key: "call",
      header: "Call",
      render: (item) => {
        const isDone =
          item.verificationCall?.done || item.verificationCall?.callCompleted;
        return (
          <Badge tone={isDone ? "brand" : "warning"}>
            {isDone ? "Done" : "Pending"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <Link
          href={`/verifications/${item._id}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          Review
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Verification Queue"
      contextLine="Review owner identity, business documents, and record verification calls."
    >
      <div className="space-y-4">
        {/* Filter bar */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          searchPlaceholder="Search by name, email, or phone..."
        >
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Waiting for review", value: "pending" },
              { label: "All Statuses", value: "all" },
              { label: "Approved", value: "approved" },
              { label: "Not approved", value: "rejected" },
              { label: "New documents needed", value: "reverification_required" },
              { label: "Suspended", value: "suspended" },
              { label: "Not submitted", value: "not_submitted" },
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "All Types", value: "all" },
              { label: "Agent", value: "agent" },
              { label: "Individual", value: "individual" },
            ]}
          />

          <Select
            value={destinationFilter}
            onChange={(e) => {
              setDestinationFilter(e.target.value);
              setPage(1);
            }}
            options={destinationOptions}
          />
        </FilterBar>

        {/* Queue Table */}
        <DataTable
          columns={columns}
          data={sortedItems}
          keyExtractor={(item) => item._id}
          isLoading={verificationsQuery.isLoading}
          emptyMessage="Nothing waiting."
        />

        {/* Pagination */}
        {verificationsQuery.data && verificationsQuery.data.totalPages > 1 && (
          <Pagination
            page={verificationsQuery.data.page}
            limit={verificationsQuery.data.limit}
            totalItems={verificationsQuery.data.totalItems}
            totalPages={verificationsQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
