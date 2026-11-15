"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  CalendarRange,
  Clock,
  Filter,
} from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyVehicles, getVehicleUnavailability } from "@/lib/api/vehicles";
import { getReceivedBookings } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import {
  formatUnavailabilityReason,
  getBookingStatusMeta,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";
import type { Booking } from "@/types/booking";
import type { VehicleUnavailability } from "@/types/unavailability";

export default function SchedulePage() {
  useEffect(() => {
    document.title = "Schedule | Trip Wheels Partner";
  }, []);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [showBlocked, setShowBlocked] = useState<boolean>(true);

  // 1. Fetch all publisher vehicles
  const {
    data: vehiclesData,
    isLoading: isLoadingVehicles,
    isError: isErrorVehicles,
  } = useQuery({
    queryKey: queryKeys.vehicles.mine({ limit: 100 }),
    queryFn: () => getMyVehicles({ limit: 100 }),
  });

  const vehicles: Vehicle[] = useMemo(
    () => vehiclesData?.items || [],
    [vehiclesData?.items]
  );

  // 2. Fetch publisher bookings
  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    isError: isErrorBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: queryKeys.bookings.received({ limit: 100 }),
    queryFn: () => getReceivedBookings({ limit: 100 }),
  });

  const allBookings: Booking[] = useMemo(
    () => bookingsData?.items || [],
    [bookingsData?.items]
  );

  // 3. Fetch unavailability blocks for vehicles
  // If a single vehicle is selected, fetch for that; otherwise fetch for all vehicles
  const {
    data: blocksMap = {},
    isLoading: isLoadingBlocks,
    refetch: refetchBlocks,
  } = useQuery<Record<string, VehicleUnavailability[]>>({
    queryKey: ["schedule", "blocks", selectedVehicleId, vehicles.map((v) => v._id).join(",")],
    queryFn: async () => {
      const targetVehicleIds =
        selectedVehicleId !== "all"
          ? [selectedVehicleId]
          : vehicles.map((v) => v._id);

      const map: Record<string, VehicleUnavailability[]> = {};
      const results = await Promise.allSettled(
        targetVehicleIds.map((id) => getVehicleUnavailability(id))
      );

      results.forEach((res, index) => {
        const vid = targetVehicleIds[index];
        if (res.status === "fulfilled") {
          map[vid] = res.value;
        } else {
          map[vid] = [];
        }
      });

      return map;
    },
    enabled: vehicles.length > 0 && showBlocked,
  });

  // Next 14 days array starting from today
  const scheduleDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }).map((_, i) => addDays(today, i));
  }, []);

  // Filter bookings by selected vehicle
  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      if (selectedVehicleId !== "all") {
        const matches =
          b.vehicle?._id === selectedVehicleId ||
          b.assignedVehicle?._id === selectedVehicleId;
        if (!matches) return false;
      }

      // Ignore terminal statuses that don't result in pickup/return
      const ignoredStatuses = [
        "rejected",
        "expired",
        "cancelled_by_customer",
        "cancelled_by_publisher",
        "vehicle_unavailable",
      ];
      return !ignoredStatuses.includes(b.status);
    });
  }, [allBookings, selectedVehicleId]);

  // Aggregate blocks for selected vehicle or all
  const filteredBlocks = useMemo(() => {
    if (!showBlocked) return [];
    if (selectedVehicleId !== "all") {
      return blocksMap[selectedVehicleId] || [];
    }

    const all: VehicleUnavailability[] = [];
    Object.values(blocksMap).forEach((list) => {
      all.push(...list);
    });
    return all;
  }, [blocksMap, selectedVehicleId, showBlocked]);

  const isLoading =
    isLoadingVehicles || isLoadingBookings || (showBlocked && isLoadingBlocks);
  const isError = isErrorVehicles || isErrorBookings;

  return (
    <AppShell
      title="Schedule"
      subtitle="Pickups, returns and blocked dates for the next 14 days."
    >
      <div className="flex flex-col gap-6">
        {/* Filter Controls Bar */}
        <div className="p-4 rounded-md border border-(--line) bg-(--surface) flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-(--brand) shrink-0" />
              <label
                htmlFor="vehicle-filter"
                className="text-xs font-semibold text-(--ink) whitespace-nowrap"
              >
                Filter by vehicle:
              </label>
            </div>

            <Select
              id="vehicle-filter"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="text-xs max-w-xs"
            >
              <option value="all">All vehicles</option>
              {vehicles.map((v) => {
                const reg =
                  v.registrationNumber ||
                  v.rc?.registrationNumber ||
                  v.type;
                return (
                  <option key={v._id} value={v._id}>
                    {v.brand} {v.model} ({reg})
                  </option>
                );
              })}
            </Select>
          </div>

          <div className="flex items-center">
            <Checkbox
              id="toggle-show-blocked"
              label="Show blocked dates"
              checked={showBlocked}
              onChange={(e) => setShowBlocked(e.target.checked)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="p-4 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-3"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-md border border-(--negative) bg-(--negative)/10 text-xs text-(--negative) flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to load schedule data.</p>
                <p className="mt-0.5 text-(--ink-soft)">
                  Please check your connection and try again.
                </p>
              </div>
            </div>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                refetchBookings();
                refetchBlocks();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* 14 Days Timeline List */}
        {!isLoading && !isError && (
          <div className="flex flex-col gap-4">
            {scheduleDays.map((day) => {
              const dayStart = startOfDay(day);
              const dayEnd = endOfDay(day);

              // Pickups starting on this day
              const dayPickups = filteredBookings.filter((b) =>
                isSameDay(parseISO(b.startAt), day)
              );

              // Returns ending on this day
              const dayReturns = filteredBookings.filter((b) =>
                isSameDay(parseISO(b.endAt), day)
              );

              // Blocks spanning this day
              const dayBlocks = filteredBlocks.filter((b) => {
                const from = parseISO(b.from);
                const to = parseISO(b.to);
                return from <= dayEnd && to >= dayStart;
              });

              const hasItems =
                dayPickups.length > 0 ||
                dayReturns.length > 0 ||
                (showBlocked && dayBlocks.length > 0);

              const todayFlag = isToday(day);
              const tomorrowFlag = isSameDay(day, addDays(new Date(), 1));

              let dayHeaderLabel = format(day, "EEEE, d MMMM");
              if (todayFlag) {
                dayHeaderLabel = `Today, ${format(day, "d MMMM")}`;
              } else if (tomorrowFlag) {
                dayHeaderLabel = `Tomorrow, ${format(day, "d MMMM")}`;
              }

              return (
                <section
                  key={day.toISOString()}
                  className={clsx(
                    "rounded-md border bg-(--surface) p-4 sm:p-5 flex flex-col gap-3 transition-colors",
                    todayFlag ? "border-(--brand) ring-1 ring-(--brand)" : "border-(--line)"
                  )}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-(--line) pb-2">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="w-4 h-4 text-(--brand)" />
                      <h2 className="font-display text-sm sm:text-base font-bold text-(--ink)">
                        {dayHeaderLabel}
                      </h2>
                    </div>

                    {todayFlag && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-(--brand) text-white px-2 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Content */}
                  {!hasItems ? (
                    <p className="text-xs text-(--ink-soft) italic py-1">
                      No pickups or returns.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Pickups */}
                      {dayPickups.map((b) => {
                        const meta = getBookingStatusMeta(b.status);
                        const vName = `${b.vehicle.brand} ${b.vehicle.model}`;
                        const cName = b.customer?.fullName || "Customer";

                        return (
                          <div
                            key={`pickup-${b._id}`}
                            className="p-3 rounded border border-(--line) bg-(--paper) flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="p-1.5 rounded bg-(--brand-tint) text-(--brand) shrink-0 mt-0.5">
                                <ArrowDownLeft className="w-4 h-4" />
                              </span>

                              <div className="flex flex-col gap-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge tone="brand">Pickup</Badge>
                                  <span className="font-semibold text-xs text-(--ink) flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-(--ink-soft)" />
                                    {format(parseISO(b.startAt), "h:mm a")}
                                  </span>
                                  <Link
                                    href={`/bookings/${b._id}`}
                                    className="font-mono text-xs font-bold text-(--brand) hover:underline"
                                  >
                                    {b.bookingCode}
                                  </Link>
                                </div>

                                <p className="text-xs text-(--ink)">
                                  <strong className="font-semibold">{vName}</strong> • {cName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              <Link href={`/bookings/${b._id}`}>
                                <Button variant="quiet" size="sm" className="text-xs">
                                  View booking
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}

                      {/* Returns */}
                      {dayReturns.map((b) => {
                        const meta = getBookingStatusMeta(b.status);
                        const vName = `${b.vehicle.brand} ${b.vehicle.model}`;
                        const cName = b.customer?.fullName || "Customer";

                        return (
                          <div
                            key={`return-${b._id}`}
                            className="p-3 rounded border border-(--line) bg-(--paper) flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="p-1.5 rounded bg-amber-50 text-(--warning) shrink-0 mt-0.5">
                                <ArrowUpRight className="w-4 h-4" />
                              </span>

                              <div className="flex flex-col gap-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge tone="warning">Return</Badge>
                                  <span className="font-semibold text-xs text-(--ink) flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-(--ink-soft)" />
                                    {format(parseISO(b.endAt), "h:mm a")}
                                  </span>
                                  <Link
                                    href={`/bookings/${b._id}`}
                                    className="font-mono text-xs font-bold text-(--brand) hover:underline"
                                  >
                                    {b.bookingCode}
                                  </Link>
                                </div>

                                <p className="text-xs text-(--ink)">
                                  <strong className="font-semibold">{vName}</strong> • {cName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              <Link href={`/bookings/${b._id}`}>
                                <Button variant="quiet" size="sm" className="text-xs">
                                  View booking
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}

                      {/* Blocks on this day (if showBlocked is enabled) */}
                      {showBlocked &&
                        dayBlocks.map((block) => {
                          const v = vehicles.find((item) => item._id === block.vehicle);
                          const vName = v
                            ? `${v.brand} ${v.model}`
                            : "Vehicle";

                          return (
                            <div
                              key={`block-${block._id}`}
                              className="p-3 rounded border border-(--line) bg-(--surface) flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3">
                                <span className="p-1.5 rounded bg-(--paper) text-(--ink-soft) shrink-0 mt-0.5">
                                  <Ban className="w-4 h-4" />
                                </span>

                                <div className="flex flex-col gap-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone="neutral">Blocked</Badge>
                                    <span className="text-xs font-semibold text-(--ink)">
                                      {formatUnavailabilityReason(block.reason)}
                                    </span>
                                  </div>

                                  <p className="text-xs text-(--ink-soft)">
                                    {vName} • Period: {formatDate(block.from)} to{" "}
                                    {formatDate(block.to)}
                                  </p>
                                </div>
                              </div>

                              <Link
                                href={`/vehicles/${block.vehicle}`}
                                className="self-start sm:self-center"
                              >
                                <Button variant="quiet" size="sm" className="text-xs">
                                  Vehicle calendar
                                </Button>
                              </Link>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
