"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import { getDashboard } from "@/lib/api/dashboard";
import { getVerifications } from "@/lib/api/verifications";
import { getAdminVehicles } from "@/lib/api/vehicles";
import { getAdminTasks } from "@/lib/api/tasks";
import { getAdminIssues } from "@/lib/api/issues";
import {
  getIssueTypeLabel,
  getSeverityMeta,
  getTaskTypeLabel,
} from "@/lib/constants";
import { formatDateTime, formatPhone, formatWaitingFor } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { VerificationQueueItem } from "@/types/verifications";
import type { AdminVehicleItem } from "@/types/vehicles";
import type { AdminTask } from "@/types/tasks";
import type { AdminIssueItem } from "@/types/issues";

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function TodayPage() {
  usePageTitle("Today");

  // 1. Dashboard counts
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: getDashboard,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // 2. Pending verifications (up to 5)
  const verificationsQuery = useQuery({
    queryKey: queryKeys.verifications.list({ status: "pending", limit: 5 }),
    queryFn: () => getVerifications({ status: "pending", limit: 5 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // 3. Pending vehicles (up to 5)
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.list({ status: "pending_review", limit: 5 }),
    queryFn: () => getAdminVehicles({ status: "pending_review", limit: 5 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // 4. Open tasks for calls
  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.list({ status: "open", limit: 20 }),
    queryFn: () => getAdminTasks({ status: "open", limit: 20 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // 5. Open issues
  const issuesQuery = useQuery({
    queryKey: queryKeys.issues.list({ status: "open", limit: 5 }),
    queryFn: () => getAdminIssues({ status: "open", limit: 5 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const counts = dashboardQuery.data;

  // Sort owners waiting for verification: oldest first
  const pendingOwners = useMemo(() => {
    const list = verificationsQuery.data?.items || [];
    return [...list].sort((a: VerificationQueueItem, b: VerificationQueueItem) => {
      const timeA = new Date(a.submittedAt || a.createdAt).getTime();
      const timeB = new Date(b.submittedAt || b.createdAt).getTime();
      return timeA - timeB;
    }).slice(0, 5);
  }, [verificationsQuery.data?.items]);

  // Sort vehicles waiting for review: oldest first
  const pendingVehicles = useMemo(() => {
    const list = vehiclesQuery.data?.items || [];
    return [...list].sort((a: AdminVehicleItem, b: AdminVehicleItem) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    }).slice(0, 5);
  }, [vehiclesQuery.data?.items]);

  // Filter open tasks of call types
  const callTasks = useMemo(() => {
    const list = tasksQuery.data?.items || [];
    return list
      .filter((task: AdminTask) => typeof task.type === "string" && task.type.startsWith("call_"))
      .slice(0, 5);
  }, [tasksQuery.data?.items]);

  // Sort open issues: newest and most severe first
  const openIssues = useMemo(() => {
    const list = issuesQuery.data?.items || [];
    return [...list].sort((a: AdminIssueItem, b: AdminIssueItem) => {
      const weightA = SEVERITY_WEIGHTS[a.severity] || 0;
      const weightB = SEVERITY_WEIGHTS[b.severity] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 5);
  }, [issuesQuery.data?.items]);

  // Latest refresh timestamp from any updated query
  const lastRefreshTimestamp = Math.max(
    dashboardQuery.dataUpdatedAt || 0,
    verificationsQuery.dataUpdatedAt || 0,
    vehiclesQuery.dataUpdatedAt || 0,
    tasksQuery.dataUpdatedAt || 0,
    issuesQuery.dataUpdatedAt || 0
  );

  const totalDecisionsCount =
    (counts?.pendingVerifications ?? 0) + (counts?.pendingVehicles ?? 0);

  const bookingsAtRiskEmpty =
    (counts?.requestsAwaitingResponse ?? 0) === 0 &&
    (counts?.unconfirmedVehicles24h ?? 0) === 0 &&
    (counts?.upcomingPickups24h ?? 0) === 0;

  return (
    <AppShell
      title="Today"
      contextLine="Urgent operational decisions, calls and open issues."
      counts={{
        verifications: counts?.pendingVerifications,
        vehicles: counts?.pendingVehicles,
        tasks: counts?.openTasks,
        issues: counts?.openIssues,
      }}
    >
      <div className="space-y-6">
        {/* Section 1: Decisions waiting */}
        <section className="bg-surface border border-line rounded p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink font-display">
              Decisions waiting ({totalDecisionsCount})
            </h2>
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              <Link
                href="/verifications?status=pending"
                className="text-brand hover:underline font-medium"
              >
                All verifications ({counts?.pendingVerifications ?? 0})
              </Link>
              <span>|</span>
              <Link
                href="/vehicles?status=pending_review"
                className="text-brand hover:underline font-medium"
              >
                All vehicles ({counts?.pendingVehicles ?? 0})
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {/* Owners waiting for verification */}
            <div>
              <h3 className="text-xs uppercase font-medium tracking-wider text-ink-soft mb-3">
                Owners waiting for verification
              </h3>
              {verificationsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : pendingOwners.length === 0 ? (
                <p className="text-sm text-ink-soft py-2">Nothing waiting.</p>
              ) : (
                <ol className="divide-y divide-line">
                  {pendingOwners.map((item, index) => {
                    const waited = formatWaitingFor(item.submittedAt || item.createdAt);
                    const isAgent = item.publisherType === "agent";
                    const location =
                      item.individualArea?.city ||
                      (typeof item.destination === "object" ? item.destination?.name : item.destination);

                    return (
                      <li
                        key={item._id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-mono font-medium text-ink-soft w-5 shrink-0 pt-0.5">
                            {index + 1}.
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/verifications/${item._id}`}
                                className="text-sm font-semibold text-ink hover:text-brand"
                              >
                                {item.user?.fullName || "Unnamed Owner"}
                              </Link>
                              <Badge tone={isAgent ? "brand" : "neutral"}>
                                {isAgent ? "Agent" : "Individual"}
                              </Badge>
                              {item.businessName && (
                                <span className="text-xs text-ink-soft">
                                  ({item.businessName})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-ink-soft mt-0.5">
                              {location && <span>{location} &bull; </span>}
                              <span>Waited {waited}</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/verifications/${item._id}`}
                          className="text-xs font-medium text-brand hover:underline self-start sm:self-auto pl-8 sm:pl-0"
                        >
                          Review owner
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Vehicles waiting for review */}
            <div>
              <h3 className="text-xs uppercase font-medium tracking-wider text-ink-soft mb-3">
                Vehicles waiting for review
              </h3>
              {vehiclesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : pendingVehicles.length === 0 ? (
                <p className="text-sm text-ink-soft py-2">Nothing waiting.</p>
              ) : (
                <ol className="divide-y divide-line">
                  {pendingVehicles.map((vehicle, index) => {
                    const submitted = formatWaitingFor(vehicle.createdAt);
                    const publisherName =
                      typeof vehicle.publisher === "object"
                        ? vehicle.publisher?.fullName
                        : null;

                    return (
                      <li
                        key={vehicle._id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-mono font-medium text-ink-soft w-5 shrink-0 pt-0.5">
                            {index + 1}.
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/vehicles/${vehicle._id}`}
                                className="text-sm font-semibold text-ink hover:text-brand"
                              >
                                {vehicle.brand} {vehicle.model}
                              </Link>
                              <Badge tone="neutral">
                                {vehicle.type === "car" ? "Car" : "Bike"}
                              </Badge>
                              {vehicle.registrationNumber && (
                                <span className="text-xs font-mono text-ink-soft">
                                  {vehicle.registrationNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-ink-soft mt-0.5">
                              {publisherName && <span>By {publisherName} &bull; </span>}
                              <span>Submitted {submitted} ago</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/vehicles/${vehicle._id}`}
                          className="text-xs font-medium text-brand hover:underline self-start sm:self-auto pl-8 sm:pl-0"
                        >
                          Review vehicle
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Calls to make */}
        <section className="bg-surface border border-line rounded p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink font-display">
              Calls to make ({callTasks.length})
            </h2>
            <Link
              href="/tasks?status=open"
              className="text-xs font-medium text-brand hover:underline"
            >
              See all ({counts?.openTasks ?? 0})
            </Link>
          </div>

          <div className="mt-4">
            {tasksQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : callTasks.length === 0 ? (
              <p className="text-sm text-ink-soft py-2">Nothing waiting.</p>
            ) : (
              <ol className="divide-y divide-line">
                {callTasks.map((task, index) => {
                  const phone = task.publisher?.phone;
                  const formattedPhone = formatPhone(phone);
                  const bookingCode =
                    typeof task.booking === "object"
                      ? task.booking?.bookingCode
                      : null;
                  const bookingId =
                    typeof task.booking === "object"
                      ? task.booking?._id
                      : task.booking;
                  const createdAge = formatWaitingFor(task.createdAt);

                  return (
                    <li
                      key={task._id}
                      className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono font-medium text-ink-soft w-5 shrink-0 pt-0.5">
                          {index + 1}.
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-ink">
                              {task.publisher?.fullName || "Owner"}
                            </span>
                            <Badge tone="warning">
                              {getTaskTypeLabel(task.type)}
                            </Badge>
                            {bookingCode && (
                              <Link
                                href={`/bookings/${bookingId}`}
                                className="text-xs font-mono text-brand hover:underline"
                              >
                                {bookingCode}
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {phone ? (
                              <div className="inline-flex items-center gap-1.5">
                                <a
                                  href={`tel:${phone}`}
                                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-mono"
                                >
                                  <Phone className="w-3 h-3" />
                                  {formattedPhone || phone}
                                </a>
                                <CopyButton value={phone} label="Copy phone" />
                              </div>
                            ) : (
                              <span className="text-xs text-ink-soft">
                                No phone recorded
                              </span>
                            )}
                            <span className="text-xs text-ink-soft">
                              &bull; Created {createdAge} ago
                            </span>
                          </div>

                          {task.note && (
                            <p className="text-xs text-ink-soft mt-1 italic">
                              Note: {task.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-8 md:pl-0">
                        <Link
                          href={`/tasks`}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Manage task
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        {/* Section 3: Open issues */}
        <section className="bg-surface border border-line rounded p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink font-display">
              Open issues ({counts?.openIssues ?? 0})
            </h2>
            <Link
              href="/issues?status=open"
              className="text-xs font-medium text-brand hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="mt-4">
            {issuesQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : openIssues.length === 0 ? (
              <p className="text-sm text-ink-soft py-2">Nothing waiting.</p>
            ) : (
              <ol className="divide-y divide-line">
                {openIssues.map((issue, index) => {
                  const severityMeta = getSeverityMeta(issue.severity);
                  const issueType = getIssueTypeLabel(issue.type);
                  const bookingCode = issue.booking?.bookingCode;
                  const bookingId = issue.booking?._id;
                  const createdAge = formatWaitingFor(issue.createdAt);

                  return (
                    <li
                      key={issue._id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono font-medium text-ink-soft w-5 shrink-0 pt-0.5">
                          {index + 1}.
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-ink">
                              {issueType}
                            </span>
                            <Badge tone={severityMeta.tone}>
                              {severityMeta.label}
                            </Badge>
                            {bookingCode && (
                              <Link
                                href={`/bookings/${bookingId}`}
                                className="text-xs font-mono text-brand hover:underline"
                              >
                                {bookingCode}
                              </Link>
                            )}
                          </div>
                          <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">
                            {issue.description}
                          </p>
                          <div className="text-xs text-ink-soft mt-0.5">
                            <span>Reported {createdAge} ago</span>
                            {issue.raisedBy && (
                              <span> &bull; By {issue.raisedBy.fullName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/issues/${issue._id}`}
                        className="text-xs font-medium text-brand hover:underline self-start sm:self-auto pl-8 sm:pl-0"
                      >
                        Review issue
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        {/* Section 4: Bookings at risk in the next 24 hours */}
        <section className="bg-surface border border-line rounded p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink font-display">
              Bookings at risk in the next 24 hours
            </h2>
            <Link
              href="/bookings"
              className="text-xs font-medium text-brand hover:underline"
            >
              All bookings
            </Link>
          </div>

          <div className="mt-4">
            {dashboardQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : bookingsAtRiskEmpty ? (
              <p className="text-sm text-ink-soft py-2">Nothing waiting.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-line/60">
                  <Link
                    href="/bookings?status=requested"
                    className="text-sm text-ink hover:text-brand font-medium hover:underline"
                  >
                    {counts?.requestsAwaitingResponse ?? 0} requests awaiting response
                  </Link>
                  <Link
                    href="/bookings?status=requested"
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    View list
                  </Link>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-line/60">
                  <Link
                    href="/bookings?status=confirmed&unconfirmedVehicle=true"
                    className="text-sm text-ink hover:text-brand font-medium hover:underline"
                  >
                    {counts?.unconfirmedVehicles24h ?? 0} vehicles not confirmed for pickup in 24 hours
                  </Link>
                  <Link
                    href="/bookings?status=confirmed&unconfirmedVehicle=true"
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    View list
                  </Link>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-line/60">
                  <Link
                    href="/bookings?status=confirmed"
                    className="text-sm text-ink hover:text-brand font-medium hover:underline"
                  >
                    {counts?.upcomingPickups24h ?? 0} pickups due in 24 hours
                  </Link>
                  <Link
                    href="/bookings?status=confirmed"
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    View list
                  </Link>
                </div>

                <p className="text-xs text-ink-soft pt-2">
                  Note: A dedicated list endpoint for 24-hour at-risk bookings would allow itemized triage.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Bottom line: Last refreshed timestamp */}
        <div className="text-xs text-ink-soft pt-2 pb-4">
          {lastRefreshTimestamp > 0
            ? `Last refreshed at ${formatDateTime(new Date(lastRefreshTimestamp))}`
            : "Updating..."}
        </div>
      </div>
    </AppShell>
  );
}
