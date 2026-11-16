"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  subDays,
  startOfMonth,
  subMonths,
  endOfMonth,
  differenceInDays,
} from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { getAnalyticsDestinations, getAnalyticsOverview } from "@/lib/api/system";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

type DatePreset = "7d" | "30d" | "month" | "custom";
type SortField = "name" | "state" | "totalRequests" | "completedBookings" | "activeVehicles";

interface OverviewMetricRow {
  key: string;
  name: string;
  description: string;
  currentValue: string;
  previousValue: string;
  change: string;
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customFrom, setCustomFrom] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [customTo, setCustomTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedDestination, setSelectedDestination] = useState<string>("all");

  const [sortField, setSortField] = useState<SortField>("totalRequests");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Calculate current and previous date ranges
  const { currentRange, previousRange } = useMemo(() => {
    const now = new Date();

    if (preset === "7d") {
      const curFrom = subDays(now, 7);
      const curTo = now;
      const prevFrom = subDays(now, 14);
      const prevTo = subDays(now, 7);
      return {
        currentRange: {
          from: curFrom.toISOString(),
          to: curTo.toISOString(),
          label: "Last 7 days",
        },
        previousRange: {
          from: prevFrom.toISOString(),
          to: prevTo.toISOString(),
          label: "Previous 7 days",
        },
      };
    }

    if (preset === "month") {
      const curFrom = startOfMonth(now);
      const curTo = now;
      const prevFrom = startOfMonth(subMonths(now, 1));
      const prevTo = endOfMonth(subMonths(now, 1));
      return {
        currentRange: {
          from: curFrom.toISOString(),
          to: curTo.toISOString(),
          label: "This month",
        },
        previousRange: {
          from: prevFrom.toISOString(),
          to: prevTo.toISOString(),
          label: "Last month",
        },
      };
    }

    if (preset === "custom") {
      const curFrom = new Date(`${customFrom}T00:00:00.000Z`);
      const curTo = new Date(`${customTo}T23:59:59.999Z`);
      const dayDiff = Math.max(1, differenceInDays(curTo, curFrom));
      const prevFrom = subDays(curFrom, dayDiff);
      const prevTo = curFrom;

      return {
        currentRange: {
          from: curFrom.toISOString(),
          to: curTo.toISOString(),
          label: `${customFrom} to ${customTo}`,
        },
        previousRange: {
          from: prevFrom.toISOString(),
          to: prevTo.toISOString(),
          label: "Prior period",
        },
      };
    }

    // Default: 30d
    const curFrom = subDays(now, 30);
    const curTo = now;
    const prevFrom = subDays(now, 60);
    const prevTo = subDays(now, 30);
    return {
      currentRange: {
        from: curFrom.toISOString(),
        to: curTo.toISOString(),
        label: "Last 30 days",
      },
      previousRange: {
        from: prevFrom.toISOString(),
        to: prevTo.toISOString(),
        label: "Previous 30 days",
      },
    };
  }, [preset, customFrom, customTo]);

  // Fetch overview metrics for current period
  const {
    data: currentOverview,
    isLoading: isCurrentLoading,
    isError: isCurrentError,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ["admin", "analytics", "overview", currentRange.from, currentRange.to],
    queryFn: () =>
      getAnalyticsOverview({ from: currentRange.from, to: currentRange.to }),
  });

  // Fetch overview metrics for previous period
  const {
    data: prevOverview,
    isLoading: isPrevLoading,
  } = useQuery({
    queryKey: ["admin", "analytics", "overview", previousRange.from, previousRange.to],
    queryFn: () =>
      getAnalyticsOverview({ from: previousRange.from, to: previousRange.to }),
  });

  // Fetch destination breakdown
  const {
    data: destinationsData,
    isLoading: isDestinationsLoading,
    isError: isDestinationsError,
    refetch: refetchDestinations,
  } = useQuery({
    queryKey: ["admin", "analytics", "destinations"],
    queryFn: getAnalyticsDestinations,
  });

  // Unique destinations for filter dropdown
  const destinationOptions = useMemo(() => {
    const list = [{ label: "All destinations", value: "all" }];
    if (destinationsData) {
      for (const item of destinationsData) {
        list.push({
          label: `${item.destination.name}, ${item.destination.state}`,
          value: item.destination._id,
        });
      }
    }
    return list;
  }, [destinationsData]);

  // Build overview table rows
  const overviewRows: OverviewMetricRow[] = useMemo(() => {
    const cur = currentOverview;
    const prev = prevOverview;

    const formatPct = (val?: number): string => {
      if (val === undefined || val === null || Number.isNaN(val)) return "No data";
      return `${val.toFixed(1)}%`;
    };

    const formatNum = (val?: number): string => {
      if (val === undefined || val === null || Number.isNaN(val)) return "No data";
      return val.toLocaleString("en-IN");
    };

    const formatMins = (val?: number): string => {
      if (val === undefined || val === null || Number.isNaN(val)) return "No data";
      if (val < 60) return `${val} mins`;
      const hrs = Math.floor(val / 60);
      const mins = val % 60;
      return `${hrs}h ${mins}m`;
    };

    const formatHours = (val?: number): string => {
      if (val === undefined || val === null || Number.isNaN(val)) return "No data";
      return `${val.toFixed(1)} hrs`;
    };

    const computeChangePct = (curVal?: number, prevVal?: number): string => {
      if (
        curVal === undefined ||
        prevVal === undefined ||
        curVal === null ||
        prevVal === null ||
        Number.isNaN(curVal) ||
        Number.isNaN(prevVal)
      ) {
        return "No data";
      }
      const diff = curVal - prevVal;
      if (Math.abs(diff) < 0.1) return "No change";
      const sign = diff > 0 ? "+" : "";
      return `${sign}${diff.toFixed(1)}%`;
    };

    const computeChangeNum = (curVal?: number, prevVal?: number): string => {
      if (
        curVal === undefined ||
        prevVal === undefined ||
        curVal === null ||
        prevVal === null ||
        Number.isNaN(curVal) ||
        Number.isNaN(prevVal)
      ) {
        return "No data";
      }
      const diff = curVal - prevVal;
      if (diff === 0) return "No change";
      const sign = diff > 0 ? "+" : "";
      return `${sign}${diff.toLocaleString("en-IN")}`;
    };

    return [
      {
        key: "requestsCreated",
        name: "Requests created",
        description: "Total customer booking requests submitted in the period.",
        currentValue: formatNum(cur?.requestsCreated),
        previousValue: formatNum(prev?.requestsCreated),
        change: computeChangeNum(cur?.requestsCreated, prev?.requestsCreated),
      },
      {
        key: "acceptanceRate",
        name: "Acceptance rate",
        description: "Percentage of decided booking requests accepted by owners.",
        currentValue: formatPct(cur?.acceptanceRate),
        previousValue: formatPct(prev?.acceptanceRate),
        change: computeChangePct(cur?.acceptanceRate, prev?.acceptanceRate),
      },
      {
        key: "rejectionRate",
        name: "Rejection rate",
        description: "Percentage of decided booking requests rejected by owners.",
        currentValue: formatPct(cur?.rejectionRate),
        previousValue: formatPct(prev?.rejectionRate),
        change: computeChangePct(cur?.rejectionRate, prev?.rejectionRate),
      },
      {
        key: "expiryRate",
        name: "Expiry rate",
        description: "Percentage of booking requests expired without an owner response.",
        currentValue: formatPct(cur?.expiryRate),
        previousValue: formatPct(prev?.expiryRate),
        change: computeChangePct(cur?.expiryRate, prev?.expiryRate),
      },
      {
        key: "avgResponseMinutes",
        name: "Average owner response time",
        description: "Average minutes taken by owners to accept or reject requests.",
        currentValue: formatMins(cur?.avgResponseMinutes),
        previousValue: formatMins(prev?.avgResponseMinutes),
        change: computeChangeNum(cur?.avgResponseMinutes, prev?.avgResponseMinutes),
      },
      {
        key: "completionRate",
        name: "Completion rate",
        description: "Percentage of accepted bookings successfully completed.",
        currentValue: formatPct(cur?.completionRate),
        previousValue: formatPct(prev?.completionRate),
        change: computeChangePct(cur?.completionRate, prev?.completionRate),
      },
      {
        key: "cancellationRate",
        name: "Cancellation rate",
        description: "Percentage of total requests cancelled by customers or owners.",
        currentValue: formatPct(cur?.cancellationRate),
        previousValue: formatPct(prev?.cancellationRate),
        change: computeChangePct(cur?.cancellationRate, prev?.cancellationRate),
      },
      {
        key: "noShowRate",
        name: "No-show rate",
        description: "Percentage of accepted bookings where customer did not arrive at pickup.",
        currentValue: formatPct(cur?.noShowRate),
        previousValue: formatPct(prev?.noShowRate),
        change: computeChangePct(cur?.noShowRate, prev?.noShowRate),
      },
      {
        key: "vehicleConfirmationMissedRate",
        name: "Vehicle confirmation missed rate",
        description: "Percentage of accepted bookings missing assigned vehicle confirmation by deadline.",
        currentValue: formatPct(cur?.vehicleConfirmationMissedRate),
        previousValue: formatPct(prev?.vehicleConfirmationMissedRate),
        change: computeChangePct(
          cur?.vehicleConfirmationMissedRate,
          prev?.vehicleConfirmationMissedRate
        ),
      },
      {
        key: "lateDisclosureRate",
        name: "Late disclosure rate",
        description: "Percentage of vehicle unavailability reports submitted within late window.",
        currentValue: formatPct(cur?.lateDisclosureRate),
        previousValue: formatPct(prev?.lateDisclosureRate),
        change: computeChangePct(cur?.lateDisclosureRate, prev?.lateDisclosureRate),
      },
      {
        key: "issueRate",
        name: "Issue rate",
        description: "Percentage of completed bookings with opened customer or owner complaints.",
        currentValue: formatPct(cur?.issueRate),
        previousValue: formatPct(prev?.issueRate),
        change: computeChangePct(cur?.issueRate, prev?.issueRate),
      },
      {
        key: "avgIssueResolutionHours",
        name: "Issue resolution time",
        description: "Average hours from issue opening to admin resolution.",
        currentValue: formatHours(cur?.avgIssueResolutionHours),
        previousValue: formatHours(prev?.avgIssueResolutionHours),
        change: computeChangeNum(
          cur?.avgIssueResolutionHours,
          prev?.avgIssueResolutionHours
        ),
      },
      {
        key: "verificationTurnaround",
        name: "Verification turnaround time",
        description: "Average hours from owner document submission to admin decision.",
        currentValue: "No data",
        previousValue: "No data",
        change: "No data",
      },
      {
        key: "activePublishers",
        name: "Active owners",
        description: "Approved, verified publisher accounts currently active on platform.",
        currentValue: formatNum(cur?.activePublishers),
        previousValue: formatNum(prev?.activePublishers),
        change: computeChangeNum(cur?.activePublishers, prev?.activePublishers),
      },
      {
        key: "activeVehicles",
        name: "Active vehicles",
        description: "Approved, live vehicles currently published across destinations.",
        currentValue: formatNum(cur?.activeVehicles),
        previousValue: formatNum(prev?.activeVehicles),
        change: computeChangeNum(cur?.activeVehicles, prev?.activeVehicles),
      },
    ];
  }, [currentOverview, prevOverview]);

  // Filter and sort destination breakdown
  const sortedDestinations = useMemo(() => {
    if (!destinationsData) return [];
    let list = [...destinationsData];

    if (selectedDestination !== "all") {
      list = list.filter((item) => item.destination._id === selectedDestination);
    }

    list.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      if (sortField === "name") {
        valA = a.destination.name.toLowerCase();
        valB = b.destination.name.toLowerCase();
      } else if (sortField === "state") {
        valA = a.destination.state.toLowerCase();
        valB = b.destination.state.toLowerCase();
      } else if (sortField === "totalRequests") {
        valA = a.totalRequests;
        valB = b.totalRequests;
      } else if (sortField === "completedBookings") {
        valA = a.completedBookings;
        valB = b.completedBookings;
      } else if (sortField === "activeVehicles") {
        valA = a.activeVehicles;
        valB = b.activeVehicles;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [destinationsData, selectedDestination, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink">Analytics and key metrics</h1>
        <p className="text-sm text-ink-soft mt-1">
          Operational volume, fulfillment ratios, owner response efficiency, and destination fleet distribution.
        </p>
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="bg-surface border border-line rounded p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Time period
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={preset === "7d" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPreset("7d")}
              >
                Last 7 days
              </Button>
              <Button
                variant={preset === "30d" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPreset("30d")}
              >
                Last 30 days
              </Button>
              <Button
                variant={preset === "month" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPreset("month")}
              >
                This month
              </Button>
              <Button
                variant={preset === "custom" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPreset("custom")}
              >
                Custom range
              </Button>
            </div>
          </div>

          {/* Destination Selector */}
          <div className="w-full md:w-64 space-y-1.5">
            <label className="text-xs font-semibold text-ink block">
              Destination filter
            </label>
            <Select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              options={destinationOptions}
            />
          </div>
        </div>

        {/* Custom Date Pickers */}
        {preset === "custom" && (
          <div className="pt-3 border-t border-line/60 flex flex-wrap items-center gap-3">
            <div>
              <span className="text-xs text-ink-soft block mb-1">Start date</span>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <span className="text-xs text-ink-soft block mb-1">End date</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table 1: Platform Overview Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Platform overview figures
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Comparing {currentRange.label} against {previousRange.label}.
            </p>
          </div>
        </div>

        {isCurrentError ? (
          <ErrorState
            title="Failed to load analytics overview"
            message="Could not calculate platform statistics for the chosen period."
            onRetry={() => {
              refetchCurrent();
            }}
          />
        ) : isCurrentLoading ? (
          <div className="border border-line rounded p-4 bg-surface space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="border border-line rounded bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-paper border-b border-line text-xs uppercase font-semibold text-ink-soft">
                    <th className="p-3 w-2/5">Metric figure</th>
                    <th className="p-3 text-right">Selected period</th>
                    <th className="p-3 text-right">Previous period</th>
                    <th className="p-3 text-right">Net difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs sm:text-sm">
                  {overviewRows.map((row) => (
                    <tr key={row.key} className="hover:bg-paper/40 transition-colors">
                      <td className="p-3 align-top">
                        <div className="font-semibold text-ink">{row.name}</div>
                        <div className="text-xs text-ink-soft mt-0.5 leading-normal">
                          {row.description}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-ink align-top">
                        {row.currentValue}
                      </td>
                      <td className="p-3 text-right font-mono text-ink-soft align-top">
                        {isPrevLoading ? "Loading..." : row.previousValue}
                      </td>
                      <td className="p-3 text-right font-mono text-xs align-top">
                        <span
                          className={
                            row.change.startsWith("+")
                              ? "text-brand font-medium"
                              : row.change.startsWith("-")
                              ? "text-negative font-medium"
                              : "text-ink-soft"
                          }
                        >
                          {isPrevLoading ? "Loading..." : row.change}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Plain explanation line under overview table */}
            <div className="p-3.5 bg-paper/60 border-t border-line text-xs text-ink-soft leading-relaxed">
              Acceptance, rejection and expiry rates are calculated as percentages of decided booking requests. Completion rate measures completed bookings against finished or cancelled trips. No-show and vehicle confirmation missed rates are based on accepted bookings. Figures reflect system records for the selected period.
            </div>
          </div>
        )}
      </section>

      {/* Table 2: By Destination Breakdown Table */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Destination breakdown figures
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Key operational numbers grouped by active pilot destinations.
          </p>
        </div>

        {isDestinationsError ? (
          <ErrorState
            title="Failed to load destination metrics"
            message="Could not fetch destination breakdown data from the server."
            onRetry={() => {
              refetchDestinations();
            }}
          />
        ) : isDestinationsLoading ? (
          <div className="border border-line rounded p-4 bg-surface space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sortedDestinations.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-soft border border-line bg-surface rounded">
            No destination figures match the selected filter.
          </div>
        ) : (
          <div className="border border-line rounded bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-paper border-b border-line text-xs uppercase font-semibold text-ink-soft">
                    <th className="p-3 cursor-pointer" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">
                        <span>Destination</span>
                        {sortField === "name" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort("state")}>
                      <div className="flex items-center gap-1">
                        <span>State</span>
                        {sortField === "state" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-3 text-right cursor-pointer"
                      onClick={() => handleSort("totalRequests")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Total requests</span>
                        {sortField === "totalRequests" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-3 text-right cursor-pointer"
                      onClick={() => handleSort("completedBookings")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Completed bookings</span>
                        {sortField === "completedBookings" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-3 text-right cursor-pointer"
                      onClick={() => handleSort("activeVehicles")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Active vehicles</span>
                        {sortField === "activeVehicles" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right">
                      <span>Search counts</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs sm:text-sm">
                  {sortedDestinations.map((item) => (
                    <tr
                      key={item.destination._id}
                      className="hover:bg-paper/40 transition-colors"
                    >
                      <td className="p-3 font-semibold text-ink">
                        {item.destination.name}
                      </td>
                      <td className="p-3 text-ink-soft">
                        {item.destination.state}
                      </td>
                      <td className="p-3 text-right font-mono text-ink font-medium">
                        {item.totalRequests.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-right font-mono text-ink">
                        {item.completedBookings.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-right font-mono text-ink">
                        {item.activeVehicles.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-right text-ink-soft">
                        No data
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Plain explanation line under destination table */}
            <div className="p-3.5 bg-paper/60 border-t border-line text-xs text-ink-soft leading-relaxed">
              Destination breakdown shows fleet availability and booking volume for pilot destinations. Search counts reflect customer discovery queries where recorded.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
