"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Car, Bike, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import { getDestinations } from "@/lib/api/destinations";
import { getAdminVehicles } from "@/lib/api/vehicles";
import { getVehicleStatusMeta } from "@/lib/constants";
import { formatDateOnly, formatWaitingFor } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { AdminVehicleItem } from "@/types/vehicles";

export default function VehiclesPage() {
  usePageTitle("Vehicle Management");
  const searchParams = useSearchParams();

  const initialStatus = searchParams?.get("status") || "pending_review";

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Fetch destinations for filter
  const destinationsQuery = useQuery({
    queryKey: queryKeys.destinations.all,
    queryFn: getDestinations,
  });

  // Query vehicles
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.list({
      page,
      status: statusFilter,
      type: typeFilter,
      destination: destinationFilter,
      search: searchQuery,
    }),
    queryFn: () =>
      getAdminVehicles({
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

  // Filter owner type on client side if needed and sort oldest waiting first for review
  const filteredItems = useMemo(() => {
    let list = vehiclesQuery.data?.items || [];
    if (ownerTypeFilter !== "all") {
      list = list.filter((v) => v.publisher?.role === ownerTypeFilter);
    }
    return [...list].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [vehiclesQuery.data?.items, ownerTypeFilter]);

  const destinationOptions = useMemo(() => {
    const defaultOpt = [{ label: "All Destinations", value: "all" }];
    const fetched = (destinationsQuery.data || []).map((d) => ({
      label: d.name,
      value: d._id,
    }));
    return [...defaultOpt, ...fetched];
  }, [destinationsQuery.data]);

  const columns: Column<AdminVehicleItem>[] = [
    {
      key: "photo",
      header: "Photo",
      render: (item) => {
        const firstPhoto = item.images?.[0]?.url;
        return (
          <div className="w-12 h-10 rounded border border-line bg-paper overflow-hidden flex items-center justify-center shrink-0">
            {firstPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstPhoto}
                alt={`${item.brand} ${item.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-4 h-4 text-ink-soft/40" />
            )}
          </div>
        );
      },
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/vehicles/${item._id}`}
            className="font-semibold text-ink hover:text-brand flex items-center gap-1.5"
          >
            {item.type === "car" ? (
              <Car className="w-3.5 h-3.5 text-ink-soft shrink-0" />
            ) : (
              <Bike className="w-3.5 h-3.5 text-ink-soft shrink-0" />
            )}
            <span>
              {item.brand} {item.model}
            </span>
          </Link>
          <span className="text-xs text-ink-soft">
            {item.variant ? `${item.variant} &bull; ` : ""}
            {item.year || "Year not specified"}
          </span>
        </div>
      ),
    },
    {
      key: "registration",
      header: "Reg Number",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-ink">
          {item.registrationNumber || "Unregistered"}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (item) => {
        const isAgent = item.publisher?.role === "agent";
        return (
          <div className="flex flex-col">
            <span className="font-medium text-ink text-xs">
              {item.publisher?.fullName || "Owner"}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge tone={isAgent ? "brand" : "neutral"} className="text-[10px] px-1 py-0">
                {isAgent ? "Agent" : "Individual"}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: "destination",
      header: "Destination",
      render: (item) => (
        <span className="text-xs text-ink-soft">
          {item.destination?.name || "Not set"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const meta = getVehicleStatusMeta(item.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (item) => (
        <span className="text-xs text-ink-soft">
          {formatDateOnly(item.createdAt)}
        </span>
      ),
    },
    {
      key: "waited",
      header: "Waiting",
      render: (item) => (
        <span className="text-xs font-medium text-ink">
          {formatWaitingFor(item.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <Link
          href={`/vehicles/${item._id}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          Review
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Vehicles"
      contextLine="Review vehicle specifications, safety documents, pricing and live status."
    >
      <div className="space-y-4">
        {/* Filters */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          searchPlaceholder="Search by registration, owner, or model..."
        >
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Waiting for review", value: "pending_review" },
              { label: "All Statuses", value: "all" },
              { label: "Live", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Paused", value: "paused" },
              { label: "Suspended", value: "suspended" },
              { label: "Not approved", value: "rejected" },
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
              { label: "Bike", value: "bike" },
              { label: "Car", value: "car" },
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
            value={ownerTypeFilter}
            onChange={(e) => {
              setOwnerTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "All Owner Types", value: "all" },
              { label: "Agent", value: "agent" },
              { label: "Individual", value: "individual" },
            ]}
          />
        </FilterBar>

        {/* Vehicles Table */}
        <DataTable
          columns={columns}
          data={filteredItems}
          keyExtractor={(item) => item._id}
          isLoading={vehiclesQuery.isLoading}
          emptyMessage="Nothing waiting."
        />

        {/* Pagination */}
        {vehiclesQuery.data && vehiclesQuery.data.totalPages > 1 && (
          <Pagination
            page={vehiclesQuery.data.page}
            limit={vehiclesQuery.data.limit}
            totalItems={vehiclesQuery.data.totalItems}
            totalPages={vehiclesQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </AppShell>
  );
}
