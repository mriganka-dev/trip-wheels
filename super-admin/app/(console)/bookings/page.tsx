"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Clock,
  Flag,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import { getAdminBookings } from "@/lib/api/bookings";
import { getDestinations } from "@/lib/api/destinations";
import { getBookingStatusMeta } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { BookingDetail } from "@/types/bookings";

export default function BookingsListPage() {
  usePageTitle("Bookings");
  const searchParams = useSearchParams();

  const initialStatus = searchParams?.get("status") || "all";
  const initialUnconfirmed = searchParams?.get("unconfirmedVehicle") === "true";

  const [statusFilter, setStatusFilter] = useState<string>(
    initialUnconfirmed ? "needs_attention" : initialStatus
  );
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"createdAt" | "startAt">("createdAt");
  const [page, setPage] = useState<number>(1);

  // Fetch destinations for filter
  const destinationsQuery = useQuery({
    queryKey: queryKeys.destinations.all,
    queryFn: getDestinations,
  });

  // Query bookings
  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.list({
      page,
      status: statusFilter === "needs_attention" ? undefined : statusFilter,
      destinationId: destinationFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    queryFn: () =>
      getAdminBookings({
        page,
        limit: 15,
        status: statusFilter === "needs_attention" ? undefined : statusFilter,
        destinationId: destinationFilter,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
      }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const destinationOptions = useMemo(() => {
    const defaultOpt = [{ label: "All Destinations", value: "all" }];
    const fetched = (destinationsQuery.data || []).map((d) => ({
      label: d.name,
      value: d._id,
    }));
    return [...defaultOpt, ...fetched];
  }, [destinationsQuery.data]);

  // Client-side search and "Needs attention" filtering + sorting
  const processedItems = useMemo(() => {
    let list = bookingsQuery.data?.items || [];

    // Needs attention preset: requests awaiting response, unconfirmed vehicles in 24h, or overdue
    if (statusFilter === "needs_attention") {
      const now = new Date().getTime();
      const next24h = now + 24 * 60 * 60 * 1000;

      list = list.filter((b) => {
        if (b.status === "requested") return true;
        if (b.isOverdue || b.hasOpenIssue || b.vehicleConfirmation?.missedAt) return true;

        if (b.status === "confirmed") {
          const startTime = new Date(b.startAt).getTime();
          const isWithin24h = startTime >= now && startTime <= next24h;
          const isVehicleNotConfirmed = !b.vehicleConfirmation?.confirmedAt;
          if (isWithin24h && isVehicleNotConfirmed) return true;
        }

        return false;
      });
    }

    // Client-side search by code, customer name, owner name, registration
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        const code = b.bookingCode?.toLowerCase() || "";
        const cust = b.customer?.fullName?.toLowerCase() || "";
        const pub = b.publisher?.fullName?.toLowerCase() || "";
        const reg = (b.assignedVehicle?.registrationNumber || b.vehicle?.registrationNumber || "").toLowerCase();
        const vName = `${b.vehicle?.brand || ""} ${b.vehicle?.model || ""}`.toLowerCase();
        return (
          code.includes(q) ||
          cust.includes(q) ||
          pub.includes(q) ||
          reg.includes(q) ||
          vName.includes(q)
        );
      });
    }

    // Sort by selected parameter
    return [...list].sort((a, b) => {
      const timeA = new Date(sortBy === "startAt" ? a.startAt : a.createdAt).getTime();
      const timeB = new Date(sortBy === "startAt" ? b.startAt : b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [bookingsQuery.data?.items, statusFilter, searchQuery, sortBy]);

  const columns: Column<BookingDetail>[] = [
    {
      key: "code",
      header: "Code",
      render: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/bookings/${item._id}`}
            className="font-mono font-bold text-sm text-brand hover:underline"
          >
            {item.bookingCode}
          </Link>
          <span className="text-[11px] text-ink-soft">
            {formatDateTime(item.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-ink">
            {item.customer?.fullName || "Customer"}
          </span>
          <span className="text-xs text-ink-soft">
            {item.customer?.phone || item.customer?.email}
          </span>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-ink">
            {item.publisher?.fullName || "Owner"}
          </span>
          <span className="text-xs text-ink-soft">
            {item.publisher?.phone || item.publisher?.email}
          </span>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (item) => {
        const vehicle = item.assignedVehicle || item.vehicle;
        const isSwapped =
          item.assignedVehicle &&
          item.vehicle &&
          item.assignedVehicle._id !== item.vehicle._id;

        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink">
              {vehicle?.brand} {vehicle?.model}
            </span>
            <span className="font-mono text-[11px] text-ink-soft">
              {vehicle?.registrationNumber || "Reg not recorded"}
            </span>
            {isSwapped && (
              <span className="text-[10px] text-warning font-medium">
                Vehicle swapped by owner
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "schedule",
      header: "Rental Window",
      render: (item) => (
        <div className="flex flex-col text-xs">
          <span className="text-ink font-medium">
            From: {formatDateTime(item.startAt)}
          </span>
          <span className="text-ink-soft">
            To: {formatDateTime(item.endAt)} ({item.durationHours}h)
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const meta = getBookingStatusMeta(item.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "flags",
      header: "Flags",
      render: (item) => {
        const hasIssue = Boolean(item.hasOpenIssue);
        const isOverdue = Boolean(item.isOverdue);
        const missedConfirm = Boolean(item.vehicleConfirmation?.missedAt);

        if (!hasIssue && !isOverdue && !missedConfirm) {
          return <span className="text-xs text-ink-soft">None</span>;
        }

        return (
          <div className="flex flex-col gap-1">
            {hasIssue && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-negative">
                <Flag className="w-3 h-3 shrink-0" />
                Open Issue
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-negative">
                <Clock className="w-3 h-3 shrink-0" />
                Overdue Trip
              </span>
            )}
            {missedConfirm && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Confirm Missed
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <Link
          href={`/bookings/${item._id}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Bookings"
      contextLine="Direct rental oversight, timelines, vehicle allocations and status overrides."
    >
      <div className="space-y-4">
        {/* Filters */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          searchPlaceholder="Search by code, customer, owner, or registration..."
        >
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Needs attention (At risk)", value: "needs_attention" },
              { label: "Requested", value: "requested" },
              { label: "Confirmed", value: "confirmed" },
              { label: "On trip", value: "ongoing" },
              { label: "Completed", value: "completed" },
              { label: "Rejected by owner", value: "rejected" },
              { label: "Cancelled by customer", value: "cancelled_by_customer" },
              { label: "Cancelled by owner", value: "cancelled_by_publisher" },
              { label: "Vehicle unavailable", value: "vehicle_unavailable" },
              { label: "Handover declined", value: "handover_declined" },
              { label: "No show", value: "no_show" },
              { label: "Expired", value: "expired" },
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

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "createdAt" | "startAt")}
            options={[
              { label: "Newest created first", value: "createdAt" },
              { label: "Pickup time (start)", value: "startAt" },
            ]}
          />
        </FilterBar>

        {/* Date range filter sub-bar */}
        <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-ink-soft">
          <span>Date range filter:</span>
          <div className="flex items-center gap-1.5">
            <span>From:</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1 h-7 w-36"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span>To:</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1 h-7 w-36"
            />
          </div>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="text-brand hover:underline font-medium"
            >
              Clear dates
            </button>
          )}
        </div>

        {/* Bookings Table */}
        <DataTable
          columns={columns}
          data={processedItems}
          keyExtractor={(item) => item._id}
          isLoading={bookingsQuery.isLoading}
          emptyMessage="No bookings found matching your filters."
        />

        {/* Pagination */}
        {bookingsQuery.data && bookingsQuery.data.totalPages > 1 && (
          <Pagination
            page={bookingsQuery.data.page}
            limit={bookingsQuery.data.limit}
            totalItems={bookingsQuery.data.totalItems}
            totalPages={bookingsQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
