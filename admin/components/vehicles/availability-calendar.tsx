"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  nextSaturday,
  nextSunday,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import {
  addVehicleUnavailability,
  getVehicleUnavailability,
  removeVehicleUnavailability,
} from "@/lib/api/vehicles";
import { getReceivedBookings } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import {
  formatUnavailabilityReason,
  getBookingStatusMeta,
  UNAVAILABILITY_REASONS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type {
  UnavailabilityReason,
  VehicleUnavailability,
} from "@/types/unavailability";
import type { Booking } from "@/types/booking";

interface AvailabilityCalendarProps {
  vehicleId: string;
  vehicleName: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityCalendar({
  vehicleId,
  vehicleName,
}: AvailabilityCalendarProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Block form state
  const [blockFrom, setBlockFrom] = useState<string>("");
  const [blockTo, setBlockTo] = useState<string>("");
  const [blockReason, setBlockReason] =
    useState<UnavailabilityReason>("maintenance");
  const [blockError, setBlockError] = useState<string | null>(null);

  // Block deletion confirmation dialog
  const [blockToDelete, setBlockToDelete] =
    useState<VehicleUnavailability | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Queries
  const {
    data: blocks = [],
    isLoading: isLoadingBlocks,
    isError: isErrorBlocks,
    refetch: refetchBlocks,
  } = useQuery<VehicleUnavailability[]>({
    queryKey: queryKeys.vehicles.unavailability(vehicleId),
    queryFn: () => getVehicleUnavailability(vehicleId),
    enabled: Boolean(vehicleId),
  });

  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    isError: isErrorBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: queryKeys.bookings.received({ limit: 100 }),
    queryFn: () => getReceivedBookings({ limit: 100 }),
  });

  // Filter bookings for this vehicle that are active
  const vehicleBookings: Booking[] = useMemo(() => {
    const items = bookingsData?.items || [];
    return items.filter((b) => {
      const matchVehicle =
        b.vehicle?._id === vehicleId || b.assignedVehicle?._id === vehicleId;
      const isActive =
        b.status === "confirmed" ||
        b.status === "ongoing" ||
        b.status === "requested";
      return matchVehicle && isActive;
    });
  }, [bookingsData?.items, vehicleId]);

  // Mutations
  const createBlockMutation = useMutation({
    mutationFn: (payload: {
      from: string;
      to: string;
      reason: UnavailabilityReason;
    }) => addVehicleUnavailability(vehicleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.unavailability(vehicleId),
      });
      showToast("Dates blocked successfully.", "brand");
      setBlockFrom("");
      setBlockTo("");
      setBlockError(null);
    },
    onError: (err: Error) => {
      setBlockError(err.message || "Failed to block dates.");
      showToast(err.message || "Failed to block dates.", "negative");
    },
  });

  const removeBlockMutation = useMutation({
    mutationFn: (blockId: string) =>
      removeVehicleUnavailability(vehicleId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.unavailability(vehicleId),
      });
      showToast("Date block removed.", "neutral");
      setBlockToDelete(null);
      setDeleteError(null);
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "Failed to remove block.");
      showToast(err.message || "Failed to remove block.", "negative");
    },
  });

  // Calendar month days calculation
  const startDayOfWeek = getDay(startOfMonth(currentMonth));

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(start);
    const days: Date[] = [];
    let cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    return days;
  }, [currentMonth]);

  // Helper: check what is on a specific day
  const getDayStatus = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const dayBlocks = blocks.filter((b) => {
      const from = parseISO(b.from);
      const to = parseISO(b.to);
      return from <= dayEnd && to >= dayStart;
    });

    const dayBookings = vehicleBookings.filter((b) => {
      const from = parseISO(b.startAt);
      const to = parseISO(b.endAt);
      return from <= dayEnd && to >= dayStart;
    });

    const hasConfirmed = dayBookings.some(
      (b) => b.status === "confirmed" || b.status === "ongoing"
    );
    const hasRequested = dayBookings.some((b) => b.status === "requested");
    const hasBlock = dayBlocks.length > 0;

    let primaryState: "booked" | "requested" | "blocked" | "free" = "free";
    if (hasConfirmed) {
      primaryState = "booked";
    } else if (hasRequested) {
      primaryState = "requested";
    } else if (hasBlock) {
      primaryState = "blocked";
    }

    const isConflict = (hasConfirmed || hasRequested) && hasBlock;

    return {
      primaryState,
      isConflict,
      dayBlocks,
      dayBookings,
    };
  };

  // Check form conflict: does blockFrom to blockTo overlap with any booking?
  const formConflictBookings = useMemo(() => {
    if (!blockFrom || !blockTo) return [];
    const fromDate = startOfDay(parseISO(blockFrom));
    const toDate = endOfDay(parseISO(blockTo));
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return [];

    return vehicleBookings.filter((b) => {
      const bFrom = parseISO(b.startAt);
      const bTo = parseISO(b.endAt);
      return bFrom <= toDate && bTo >= fromDate;
    });
  }, [blockFrom, blockTo, vehicleBookings]);

  // Quick actions for block form
  const handleBlockToday = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    setBlockFrom(todayStr);
    setBlockTo(todayStr);
    setBlockError(null);
  };

  const handleBlockWeekend = () => {
    const today = new Date();
    const dayOfWeek = getDay(today);
    let sat: Date;
    let sun: Date;

    if (dayOfWeek === 6) {
      sat = today;
      sun = addDays(today, 1);
    } else if (dayOfWeek === 0) {
      sat = addDays(today, -1);
      sun = today;
    } else {
      sat = nextSaturday(today);
      sun = nextSunday(today);
    }

    setBlockFrom(format(sat, "yyyy-MM-dd"));
    setBlockTo(format(sun, "yyyy-MM-dd"));
    setBlockError(null);
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockFrom || !blockTo) {
      setBlockError("Select both start and end dates.");
      return;
    }

    const fromDate = parseISO(blockFrom);
    const toDate = parseISO(blockTo);

    if (toDate < fromDate) {
      setBlockError("End date must be on or after start date.");
      return;
    }

    setBlockError(null);
    createBlockMutation.mutate({
      from: startOfDay(fromDate).toISOString(),
      to: endOfDay(toDate).toISOString(),
      reason: blockReason,
    });
  };

  // Selected day info
  const selectedDayStatus = getDayStatus(selectedDay);

  // Upcoming blocks list (sorted earliest first)
  const upcomingBlocks = useMemo(() => {
    const now = startOfDay(new Date());
    return [...blocks]
      .filter((b) => parseISO(b.to) >= now)
      .sort((a, b) => parseISO(a.from).getTime() - parseISO(b.from).getTime());
  }, [blocks]);

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar & Selected Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar (2 columns on desktop) */}
        <div className="lg:col-span-2 rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 flex flex-col gap-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-(--ink)">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <p className="text-xs text-(--ink-soft)">
                Availability and bookings for {vehicleName}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(now);
                  setSelectedDay(now);
                }}
              >
                Today
              </Button>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-2 pb-1 border-t border-(--line) text-xs">
            <span className="flex items-center gap-1.5 text-(--ink)">
              <span className="w-3 h-3 rounded-xs bg-(--brand) inline-block" />
              <span>Booked</span>
            </span>
            <span className="flex items-center gap-1.5 text-(--ink)">
              <span className="w-3 h-3 rounded-xs bg-(--warning) inline-block" />
              <span>Requested</span>
            </span>
            <span className="flex items-center gap-1.5 text-(--ink)">
              <span className="w-3 h-3 rounded-xs bg-(--ink-soft) inline-block" />
              <span>Blocked</span>
            </span>
            <span className="flex items-center gap-1.5 text-(--ink)">
              <span className="w-3 h-3 rounded-xs border border-(--line) bg-(--paper) inline-block" />
              <span>Free</span>
            </span>
            <span className="flex items-center gap-1.5 text-(--negative)">
              <span className="w-3 h-3 rounded-xs border-2 border-(--negative) bg-(--negative)/10 inline-block" />
              <span>Conflict</span>
            </span>
          </div>

          {/* Grid Header (Weekdays) */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-(--ink-soft) pb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading days */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-14 sm:h-16 rounded border border-transparent bg-transparent"
                aria-hidden="true"
              />
            ))}

            {/* Days in Month */}
            {daysInMonth.map((day) => {
              const status = getDayStatus(day);
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());

              let stateBg = "bg-(--surface)";
              let stateBorder = "border-(--line)";
              let stateBadgeText = "Free";
              let stateBadgeColor = "text-(--ink-soft)";

              if (status.isConflict) {
                stateBg = "bg-(--negative)/10";
                stateBorder = "border-(--negative)";
                stateBadgeText = "Conflict";
                stateBadgeColor = "text-(--negative) font-bold";
              } else if (status.primaryState === "booked") {
                stateBg = "bg-(--brand-tint)";
                stateBorder = "border-(--brand)";
                stateBadgeText = "Booked";
                stateBadgeColor = "text-(--brand) font-semibold";
              } else if (status.primaryState === "requested") {
                stateBg = "bg-amber-50";
                stateBorder = "border-(--warning)";
                stateBadgeText = "Requested";
                stateBadgeColor = "text-(--warning) font-semibold";
              } else if (status.primaryState === "blocked") {
                stateBg = "bg-(--paper)";
                stateBorder = "border-(--ink-soft)";
                stateBadgeText = "Blocked";
                stateBadgeColor = "text-(--ink-soft) font-semibold";
              }

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={clsx(
                    "h-14 sm:h-16 p-1 rounded-sm border text-left flex flex-col justify-between transition-colors cursor-pointer",
                    stateBg,
                    stateBorder,
                    isSelected &&
                      "ring-2 ring-(--brand) ring-offset-1 font-bold",
                    "focus-visible:outline-2 focus-visible:outline-(--brand)"
                  )}
                  aria-pressed={isSelected}
                  aria-label={`${format(day, "d MMMM yyyy")}, ${stateBadgeText}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={clsx(
                        "text-xs font-semibold leading-none",
                        isToday
                          ? "px-1 py-0.5 rounded bg-(--brand) text-white"
                          : "text-(--ink)"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Shape marker for color-blind accessibility */}
                    {status.isConflict ? (
                      <span className="w-2 h-2 rounded-full bg-(--negative)" />
                    ) : status.primaryState === "booked" ? (
                      <span className="w-2 h-2 rounded-xs bg-(--brand)" />
                    ) : status.primaryState === "requested" ? (
                      <span className="w-2 h-2 rounded-full border border-(--warning)" />
                    ) : status.primaryState === "blocked" ? (
                      <span className="w-2 h-0.5 bg-(--ink-soft)" />
                    ) : null}
                  </div>

                  <span className={clsx("text-[10px] truncate leading-tight", stateBadgeColor)}>
                    {stateBadgeText}
                  </span>
                </button>
              );
            })}
          </div>

          {(isLoadingBlocks || isLoadingBookings) && (
            <p className="text-xs text-(--ink-soft) italic">
              Updating availability and booking data...
            </p>
          )}

          {(isErrorBlocks || isErrorBookings) && (
            <div className="p-3 rounded border border-(--negative) bg-(--negative)/10 flex items-center justify-between text-xs text-(--negative)">
              <span>Failed to load some calendar data.</span>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  refetchBlocks();
                  refetchBookings();
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Selected Day Panel (1 column on desktop) */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-(--ink-soft)">
              Day schedule
            </span>
            <h4 className="font-display text-base font-bold text-(--ink) mt-0.5">
              {format(selectedDay, "EEEE, d MMMM yyyy")}
            </h4>
          </div>

          {/* Bookings on this day */}
          <div className="flex flex-col gap-2 pt-2 border-t border-(--line)">
            <span className="text-xs font-semibold text-(--ink-soft) uppercase tracking-wider">
              Bookings ({selectedDayStatus.dayBookings.length})
            </span>

            {selectedDayStatus.dayBookings.length === 0 ? (
              <p className="text-xs text-(--ink-soft)">
                No bookings on this day.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayStatus.dayBookings.map((b) => {
                  const meta = getBookingStatusMeta(b.status);
                  return (
                    <div
                      key={b._id}
                      className="p-3 rounded border border-(--line) bg-(--paper) flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/bookings/${b._id}`}
                          className="font-mono text-xs font-bold text-(--brand) hover:underline"
                        >
                          {b.bookingCode}
                        </Link>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>

                      <div className="text-xs text-(--ink)">
                        <span className="font-medium">
                          {b.customer?.fullName || "Customer"}
                        </span>
                      </div>

                      <div className="text-[11px] text-(--ink-soft) flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(parseISO(b.startAt), "d MMM, h:mm a")} to{" "}
                          {format(parseISO(b.endAt), "d MMM, h:mm a")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Owner Blocks on this day */}
          <div className="flex flex-col gap-2 pt-2 border-t border-(--line)">
            <span className="text-xs font-semibold text-(--ink-soft) uppercase tracking-wider">
              Date blocks ({selectedDayStatus.dayBlocks.length})
            </span>

            {selectedDayStatus.dayBlocks.length === 0 ? (
              <p className="text-xs text-(--ink-soft)">
                No owner blocks on this day.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayStatus.dayBlocks.map((block) => (
                  <div
                    key={block._id}
                    className="p-3 rounded border border-(--line) bg-(--paper) flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-(--ink)">
                        {formatUnavailabilityReason(block.reason)}
                      </p>
                      <p className="text-[11px] text-(--ink-soft)">
                        {format(parseISO(block.from), "d MMM")} to{" "}
                        {format(parseISO(block.to), "d MMM yyyy")}
                      </p>
                    </div>

                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => setBlockToDelete(block)}
                      className="text-(--negative) hover:bg-(--negative)/10"
                      aria-label="Remove block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Dates Form & Upcoming Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block Dates Form */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-(--ink)">
              Block dates
            </h3>
            <p className="text-xs text-(--ink-soft) mt-0.5">
              Prevent new customer requests for this vehicle during service,
              maintenance or outside rentals.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBlockToday}
            >
              Block today
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBlockWeekend}
            >
              Block this weekend
            </Button>
          </div>

          <form onSubmit={handleCreateBlock} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="block-from"
                  className="block text-xs font-semibold text-(--ink) mb-1"
                >
                  From date
                </label>
                <Input
                  id="block-from"
                  type="date"
                  value={blockFrom}
                  onChange={(e) => {
                    setBlockFrom(e.target.value);
                    setBlockError(null);
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="block-to"
                  className="block text-xs font-semibold text-(--ink) mb-1"
                >
                  To date
                </label>
                <Input
                  id="block-to"
                  type="date"
                  value={blockTo}
                  onChange={(e) => {
                    setBlockTo(e.target.value);
                    setBlockError(null);
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="block-reason"
                className="block text-xs font-semibold text-(--ink) mb-1"
              >
                Reason
              </label>
              <Select
                id="block-reason"
                value={blockReason}
                onChange={(e) =>
                  setBlockReason(e.target.value as UnavailabilityReason)
                }
              >
                {UNAVAILABILITY_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Overlap Conflict Warning */}
            {formConflictBookings.length > 0 && (
              <div className="p-3 rounded border border-(--negative) bg-(--negative)/10 text-xs text-(--negative) flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      Conflict with existing booking:
                    </span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {formConflictBookings.map((b) => (
                        <li key={b._id}>
                          Booking{" "}
                          <Link
                            href={`/bookings/${b._id}`}
                            className="font-mono underline font-bold"
                          >
                            {b.bookingCode}
                          </Link>{" "}
                          ({format(parseISO(b.startAt), "d MMM")} to{" "}
                          {format(parseISO(b.endAt), "d MMM yyyy")})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-(--ink) text-[11px] mt-1 pl-6">
                  If this vehicle cannot be provided for a confirmed booking,
                  report it on the booking so the customer is told in time.
                </p>
              </div>
            )}

            {blockError && (
              <p className="text-xs text-(--negative)">{blockError}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={createBlockMutation.isPending}
            >
              {createBlockMutation.isPending ? "Blocking..." : "Block dates"}
            </Button>
          </form>
        </div>

        {/* Upcoming Blocked Dates List */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-(--ink)">
              Upcoming blocked periods ({upcomingBlocks.length})
            </h3>
            <p className="text-xs text-(--ink-soft) mt-0.5">
              Active and scheduled blocks for this vehicle.
            </p>
          </div>

          {upcomingBlocks.length === 0 ? (
            <p className="text-xs text-(--ink-soft) py-4">
              No upcoming blocked dates for this vehicle.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {upcomingBlocks.map((block) => (
                <div
                  key={block._id}
                  className="p-3 rounded border border-(--line) bg-(--paper) flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-(--ink)">
                      {formatUnavailabilityReason(block.reason)}
                    </p>
                    <p className="text-xs text-(--ink-soft) mt-0.5">
                      {formatDate(block.from)} to {formatDate(block.to)}
                    </p>
                  </div>

                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => setBlockToDelete(block)}
                    className="text-(--negative) hover:bg-(--negative)/10"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Block Removal */}
      <Dialog
        open={Boolean(blockToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent
          title="Remove date block"
          description="Are you sure you want to remove this block? The vehicle will become available for customer requests."
        >
          {blockToDelete && (
            <div className="py-2 text-xs text-(--ink) space-y-1">
              <p>
                <span className="font-semibold">Reason:</span>{" "}
                {formatUnavailabilityReason(blockToDelete.reason)}
              </p>
              <p>
                <span className="font-semibold">Period:</span>{" "}
                {formatDate(blockToDelete.from)} to{" "}
                {formatDate(blockToDelete.to)}
              </p>
            </div>
          )}

          {deleteError && (
            <p className="text-xs text-(--negative) mt-2">{deleteError}</p>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="quiet"
              size="md"
              onClick={() => {
                setBlockToDelete(null);
                setDeleteError(null);
              }}
              disabled={removeBlockMutation.isPending}
            >
              Keep block
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                if (blockToDelete) {
                  removeBlockMutation.mutate(blockToDelete._id);
                }
              }}
              disabled={removeBlockMutation.isPending}
            >
              {removeBlockMutation.isPending
                ? "Removing..."
                : "Remove block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
