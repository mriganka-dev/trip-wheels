"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  getIndividualMisclassificationWatchlist,
  getInsuranceExpiryWatchlist,
} from "@/lib/api/users";
import { getVehicleStatusMeta } from "@/lib/constants";
import { formatDateOnly, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { InsuranceExpiryItem, MisclassificationItem } from "@/types/users";

export default function WatchlistsPage() {
  usePageTitle("Watchlists");

  const [activeTab, setActiveTab] = useState<string>("misclassification");

  // Misclassification search filter
  const [miscSearch, setMiscSearch] = useState<string>("");

  // Insurance filter states
  const [insuranceGroupFilter, setInsuranceGroupFilter] = useState<string>("all");
  const [insuranceSearch, setInsuranceSearch] = useState<string>("");

  // Query misclassifications
  const miscQuery = useQuery({
    queryKey: queryKeys.watchlists.misclassification,
    queryFn: getIndividualMisclassificationWatchlist,
    refetchInterval: 60000,
  });

  // Query insurance expiry
  const insuranceQuery = useQuery({
    queryKey: queryKeys.watchlists.insuranceExpiry,
    queryFn: getInsuranceExpiryWatchlist,
    refetchInterval: 60000,
  });

  // Filtered misclassification items
  const filteredMisc = useMemo(() => {
    const list = miscQuery.data || [];
    if (!miscSearch.trim()) return list;
    const q = miscSearch.toLowerCase().trim();
    return list.filter(
      (m) =>
        m.publisher?.fullName?.toLowerCase().includes(q) ||
        m.publisher?.email?.toLowerCase().includes(q) ||
        m.publisher?.phone?.toLowerCase().includes(q)
    );
  }, [miscQuery.data, miscSearch]);

  // Grouped and filtered insurance items
  const filteredInsurance = useMemo(() => {
    const list = insuranceQuery.data || [];
    let result = [...list];

    if (insuranceGroupFilter === "expired") {
      result = result.filter((v) => v.daysRemaining <= 0);
    } else if (insuranceGroupFilter === "within_1d") {
      result = result.filter((v) => v.daysRemaining > 0 && v.daysRemaining <= 1);
    } else if (insuranceGroupFilter === "within_7d") {
      result = result.filter((v) => v.daysRemaining > 0 && v.daysRemaining <= 7);
    } else if (insuranceGroupFilter === "within_30d") {
      result = result.filter((v) => v.daysRemaining > 0 && v.daysRemaining <= 30);
    }

    if (insuranceSearch.trim()) {
      const q = insuranceSearch.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.publisher?.fullName?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [insuranceQuery.data, insuranceGroupFilter, insuranceSearch]);

  const miscColumns: Column<MisclassificationItem>[] = [
    {
      key: "owner",
      header: "Owner",
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <Link
            href={`/verifications/${item.profileId}`}
            className="font-semibold text-ink hover:text-brand"
          >
            {item.publisher?.fullName || "Owner"}
          </Link>
          <p className="text-ink-soft text-[11px]">{item.publisher?.email}</p>
          <p className="text-ink-soft font-mono text-[11px]">{item.publisher?.phone}</p>
        </div>
      ),
    },
    {
      key: "vehicleCount",
      header: "Vehicles Listed",
      render: (item) => (
        <span className="font-mono font-bold text-xs text-ink">
          {item.vehicleCount}
        </span>
      ),
    },
    {
      key: "completedTrips",
      header: "Trips (Last 30d)",
      render: (item) => (
        <span className="font-mono text-xs text-ink font-semibold">
          {item.completedTrips30d}
        </span>
      ),
    },
    {
      key: "reasons",
      header: "Reason Listed",
      render: (item) => (
        <div className="space-y-1 text-xs">
          {item.reasons.map((r, idx) => (
            <p key={idx} className="text-warning font-medium">
              {r}
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (item) => (
        <Link
          href={`/verifications/${item.profileId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <span>Review owner</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  const insuranceColumns: Column<InsuranceExpiryItem>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (v) => (
        <div className="text-xs space-y-0.5">
          <Link
            href={`/vehicles/${v._id}`}
            className="font-semibold text-ink hover:text-brand"
          >
            {v.brand} {v.model}
          </Link>
          <p className="font-mono text-ink-soft text-[11px]">{v.registrationNumber}</p>
          {v.destination?.name && (
            <p className="text-ink-soft text-[11px]">{v.destination.name}</p>
          )}
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner Contact",
      render: (v) => (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-ink">{v.publisher?.fullName || "Owner"}</p>
          {v.publisher?.phone && (
            <a
              href={`tel:${v.publisher.phone}`}
              className="text-brand font-mono hover:underline inline-flex items-center gap-1 text-[11px]"
            >
              <Phone className="w-3 h-3" />
              {formatPhone(v.publisher.phone)}
            </a>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v) => {
        const meta = getVehicleStatusMeta(v.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "expiry",
      header: "Insurance Expiry",
      render: (v) => {
        const isExp = v.daysRemaining <= 0;
        const isUrgent = v.daysRemaining <= 7;
        const tone = isExp ? "negative" : isUrgent ? "warning" : "neutral";

        return (
          <div className="text-xs space-y-1">
            <Badge tone={tone}>
              {isExp ? "Expired" : `${v.daysRemaining} days remaining`}
            </Badge>
            <p className="text-ink-soft text-[11px]">
              Expires: {formatDateOnly(v.insuranceExpiresAt)}
            </p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      render: (v) => (
        <Link
          href={`/vehicles/${v._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <span>Review vehicle</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Watchlists"
      contextLine="Monitor individual accounts exceeding fleet caps and vehicles approaching insurance expiry."
    >
      <div className="space-y-4">
        {/* Tab switcher */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="misclassification">
              Individuals acting like agents ({miscQuery.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="insurance">
              Insurance Expiry ({insuranceQuery.data?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* 1. Individuals acting like agents */}
          <TabsContent value="misclassification" className="space-y-4 mt-4">
            <FilterBar>
              <div className="w-full sm:w-80">
                <Input
                  placeholder="Search owner name, email or phone..."
                  value={miscSearch}
                  onChange={(e) => setMiscSearch(e.target.value)}
                />
              </div>
            </FilterBar>

            <DataTable
              columns={miscColumns}
              data={filteredMisc}
              keyExtractor={(item) => item.profileId}
              isLoading={miscQuery.isLoading}
              emptyMessage="No individual accounts currently exceed vehicle limits or commercial volume thresholds."
            />
          </TabsContent>

          {/* 2. Insurance expiry */}
          <TabsContent value="insurance" className="space-y-4 mt-4">
            <FilterBar>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
                <div>
                  <Select
                    value={insuranceGroupFilter}
                    onChange={(e) => setInsuranceGroupFilter(e.target.value)}
                    options={[
                      { label: "All Warning Windows", value: "all" },
                      { label: "Expired", value: "expired" },
                      { label: "Within 1 day", value: "within_1d" },
                      { label: "Within 7 days", value: "within_7d" },
                      { label: "Within 30 days", value: "within_30d" },
                    ]}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Search registration, brand, model or owner..."
                    value={insuranceSearch}
                    onChange={(e) => setInsuranceSearch(e.target.value)}
                  />
                </div>
              </div>
            </FilterBar>

            <DataTable
              columns={insuranceColumns}
              data={filteredInsurance}
              keyExtractor={(v) => v._id}
              isLoading={insuranceQuery.isLoading}
              emptyMessage="No vehicles with expiring or expired insurance in this view."
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
