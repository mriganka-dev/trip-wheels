"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMyVehicles } from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { getVehicleStatusMeta, INDIVIDUAL_MAX_VEHICLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { checkVehicleInsurance } from "@/types/vehicle";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginatedVehiclesResponse, Vehicle } from "@/types/vehicle";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Live" },
  { id: "pending_review", label: "In review" },
  { id: "draft", label: "Draft" },
  { id: "paused", label: "Paused" },
  { id: "other", label: "Other" },
];

export default function VehiclesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("all");
  const [page, setPage] = useState(1);

  const isIndividual = user?.role === "individual";

  // Fetch all vehicles count for individual limit check
  const { data: allVehiclesData } = useQuery<PaginatedVehiclesResponse>({
    queryKey: queryKeys.vehicles.mine({ limit: 100 }),
    queryFn: () => getMyVehicles({ limit: 100 }),
    enabled: Boolean(user),
  });

  const totalIndividualCount = allVehiclesData?.totalItems ?? 0;
  const isIndividualAtLimit =
    isIndividual && totalIndividualCount >= INDIVIDUAL_MAX_VEHICLES;

  // Filter query
  const queryParams = {
    status: selectedTab === "all" ? undefined : selectedTab,
    page,
    limit: 10,
  };

  const {
    data: vehiclesData,
    isLoading,
    isError,
  } = useQuery<PaginatedVehiclesResponse>({
    queryKey: queryKeys.vehicles.mine(queryParams),
    queryFn: () => getMyVehicles(queryParams),
    enabled: Boolean(user),
  });

  const rawItems = vehiclesData?.items || [];
  // For 'other' tab, filter items client-side if status is suspended or rejected
  const vehicles: Vehicle[] =
    selectedTab === "other"
      ? rawItems.filter(
          (v) => v.status === "suspended" || v.status === "rejected"
        )
      : rawItems;

  const totalPages = vehiclesData?.totalPages || 1;

  return (
    <AppShell
      title="Your vehicles"
      subtitle="View, manage and price all vehicles listed on your account."
      actions={
        !isIndividualAtLimit ? (
          <Link href="/vehicles/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              Add a vehicle
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        {/* Individual Owner Vehicle Limit Banner */}
        {isIndividual && (
          <div className="p-4 rounded-md border border-(--line) bg-(--paper) flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold font-display text-(--ink)">
                You have {totalIndividualCount} of {INDIVIDUAL_MAX_VEHICLES} vehicles
              </p>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                {isIndividualAtLimit
                  ? "Individuals can list up to 2 vehicles. To list more, register as an agent."
                  : "Individual owners can list up to 2 vehicles."}
              </p>
            </div>
            {isIndividualAtLimit && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-(--paper) border border-(--line) text-(--ink-soft)">
                Vehicle limit reached
              </span>
            )}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="border-b border-(--line)">
          <Tabs
            value={selectedTab}
            onValueChange={(val) => {
              setSelectedTab(val);
              setPage(1);
            }}
          >
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="p-6 rounded-md border border-red-200 bg-red-50 text-center text-xs text-(--negative)"
          >
            Failed to load vehicles. Please refresh the page.
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="No vehicles found"
            description={
              selectedTab === "all"
                ? "You have not added any vehicles yet. Add your first vehicle to start receiving requests."
                : "No vehicles match the selected filter."
            }
            actionLabel={
              selectedTab === "all" && !isIndividualAtLimit
                ? "Add a vehicle"
                : undefined
            }
            onAction={
              selectedTab === "all" && !isIndividualAtLimit
                ? () => router.push("/vehicles/new")
                : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-md border border-(--line) bg-(--surface)">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-(--line) bg-(--paper)/40">
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft) w-20"
                    >
                      Photo
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)"
                    >
                      Vehicle
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)"
                    >
                      Registration
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)"
                    >
                      Price / day
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)"
                    >
                      Destination
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-(--ink-soft)"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--line)">
                  {vehicles.map((v) => {
                    const statusMeta = getVehicleStatusMeta(v.status);
                    const insuranceInfo = checkVehicleInsurance(
                      v.insurance?.expiresAt
                    );
                    const destinationName =
                      typeof v.destination === "object"
                        ? v.destination?.name
                        : "Goa";
                    const regNumber =
                      v.registrationNumber ||
                      v.rc?.registrationNumber ||
                      "Pending RC";
                    const firstPhoto = v.images && v.images[0];

                    return (
                      <tr
                        key={v._id}
                        className="transition-colors hover:bg-(--brand-tint)/10 cursor-pointer"
                        onClick={() => {
                          router.push(`/vehicles/${v._id}`);
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="w-14 h-11 relative rounded bg-(--brand-tint)/30 border border-(--line) overflow-hidden flex items-center justify-center">
                            {firstPhoto ? (
                              <Image
                                src={firstPhoto.url}
                                alt={`${v.brand} ${v.model}`}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-(--brand) uppercase">
                                {v.type}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/vehicles/${v._id}`}
                            className="font-bold text-(--ink) hover:text-(--brand) block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {v.brand} {v.model} {v.variant}
                          </Link>
                          <span className="text-xs text-(--ink-soft)">
                            {v.year} • {v.color || "Standard"}
                          </span>
                        </td>

                        <td className="px-4 py-3 capitalize text-xs text-(--ink)">
                          {v.type}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs uppercase text-(--ink)">
                          {regNumber}
                        </td>

                        <td className="px-4 py-3 font-semibold text-(--ink)">
                          {formatCurrency(v.pricing?.perDay || 0)}
                        </td>

                        <td className="px-4 py-3 text-xs text-(--ink-soft)">
                          {destinationName}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge tone={statusMeta.tone}>
                              {statusMeta.label}
                            </Badge>
                            {insuranceInfo.status !== "valid" && (
                              <span
                                className={`text-[10px] font-semibold flex items-center gap-1 ${
                                  insuranceInfo.tone === "negative"
                                    ? "text-(--negative)"
                                    : "text-amber-700"
                                }`}
                              >
                                <AlertCircle className="w-3 h-3" />
                                {insuranceInfo.status === "expired"
                                  ? "Insurance expired"
                                  : `Insurance exp in ${insuranceInfo.daysRemaining}d`}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="flex flex-col gap-3 md:hidden">
              {vehicles.map((v) => {
                const statusMeta = getVehicleStatusMeta(v.status);
                const insuranceInfo = checkVehicleInsurance(
                  v.insurance?.expiresAt
                );
                const destinationName =
                  typeof v.destination === "object"
                    ? v.destination?.name
                    : "Goa";
                const regNumber =
                  v.registrationNumber ||
                  v.rc?.registrationNumber ||
                  "Pending RC";
                const firstPhoto = v.images && v.images[0];

                return (
                  <Link
                    key={v._id}
                    href={`/vehicles/${v._id}`}
                    className="p-4 rounded-md border border-(--line) bg-(--surface) flex gap-3 hover:border-(--brand) transition-colors"
                  >
                    <div className="w-20 h-16 relative rounded shrink-0 bg-(--brand-tint)/30 border border-(--line) overflow-hidden flex items-center justify-center">
                      {firstPhoto ? (
                        <Image
                          src={firstPhoto.url}
                          alt={`${v.brand} ${v.model}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-(--brand) uppercase">
                          {v.type}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-1">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-(--ink) leading-snug">
                            {v.brand} {v.model}
                          </h3>
                          <Badge tone={statusMeta.tone}>
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="text-xs font-mono uppercase text-(--ink-soft) mt-0.5">
                          {regNumber} • {destinationName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold text-(--ink)">
                          {formatCurrency(v.pricing?.perDay || 0)}
                          <span className="font-normal text-(--ink-soft)"> / day</span>
                        </span>
                        {insuranceInfo.status !== "valid" && (
                          <span
                            className={`text-[10px] font-semibold ${
                              insuranceInfo.tone === "negative"
                                ? "text-(--negative)"
                                : "text-amber-700"
                            }`}
                          >
                            {insuranceInfo.status === "expired"
                              ? "Insurance expired"
                              : `Exp: ${insuranceInfo.daysRemaining}d`}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-2">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
