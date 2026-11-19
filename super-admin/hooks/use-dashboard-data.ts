"use client";

import useSWR from "swr";
import { getDashboard } from "@/lib/api/dashboard";
import { getVerifications } from "@/lib/api/verifications";
import { getAdminVehicles } from "@/lib/api/vehicles";
import { getAdminTasks } from "@/lib/api/tasks";
import { getAdminIssues } from "@/lib/api/issues";
import { getAdminBookings } from "@/lib/api/bookings";
import { getAnalyticsOverview } from "@/lib/api/system";
import type { DashboardCounts } from "@/types/dashboard";
import type { VerificationQueueItem } from "@/types/verifications";
import type { AdminVehicleItem } from "@/types/vehicles";
import type { AdminTask } from "@/types/tasks";
import type { AdminIssueItem } from "@/types/issues";
import type { BookingDetail } from "@/types/bookings";
import type { AnalyticsOverview } from "@/types/system";

const EMPTY_COUNTS: DashboardCounts = {
  pendingVerifications: 0,
  pendingVehicles: 0,
  openIssues: 0,
  openTasks: 0,
  requestsAwaitingResponse: 0,
  upcomingPickups24h: 0,
  unconfirmedVehicles24h: 0,
};

export function useDashboardData() {
  const {
    data: countsData,
    error: countsError,
    isLoading: countsLoading,
    mutate: mutateCounts,
  } = useSWR<DashboardCounts>("/admin/dashboard", getDashboard, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  const {
    data: verificationsData,
    isLoading: verificationsLoading,
    mutate: mutateVerifications,
  } = useSWR(
    "/admin/verifications?status=pending&limit=10",
    () => getVerifications({ status: "pending", limit: 10 }),
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false }
  );

  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    mutate: mutateVehicles,
  } = useSWR(
    "/admin/vehicles?status=pending_review&limit=10",
    () => getAdminVehicles({ status: "pending_review", limit: 10 }),
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false }
  );

  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    mutate: mutateBookings,
  } = useSWR(
    "/admin/bookings?limit=10",
    () => getAdminBookings({ limit: 10 }),
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false }
  );

  const {
    data: issuesData,
    isLoading: issuesLoading,
    mutate: mutateIssues,
  } = useSWR(
    "/admin/issues?status=open&limit=10",
    () => getAdminIssues({ status: "open", limit: 10 }),
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false }
  );

  const {
    data: tasksData,
    isLoading: tasksLoading,
    mutate: mutateTasks,
  } = useSWR(
    "/admin/tasks?status=open&limit=10",
    () => getAdminTasks({ status: "open", limit: 10 }),
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false }
  );

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    mutate: mutateAnalytics,
  } = useSWR<AnalyticsOverview>(
    "/admin/analytics/overview",
    () => getAnalyticsOverview(),
    { refreshInterval: 60000, revalidateOnFocus: true, shouldRetryOnError: false }
  );

  const isLive = !countsError && !!countsData;

  const counts: DashboardCounts = countsData || EMPTY_COUNTS;
  const verifications: VerificationQueueItem[] = verificationsData?.items || [];
  const vehicles: AdminVehicleItem[] = vehiclesData?.items || [];
  const bookings: BookingDetail[] = bookingsData?.items || [];
  const issues: AdminIssueItem[] = issuesData?.items || [];
  const tasks: AdminTask[] = tasksData?.items || [];
  const analytics: AnalyticsOverview | null = analyticsData || null;

  const refreshAll = async () => {
    await Promise.allSettled([
      mutateCounts(),
      mutateVerifications(),
      mutateVehicles(),
      mutateBookings(),
      mutateIssues(),
      mutateTasks(),
      mutateAnalytics(),
    ]);
  };

  return {
    isLive,
    isLoading: countsLoading || verificationsLoading || vehiclesLoading || bookingsLoading || issuesLoading || tasksLoading,
    counts,
    verifications,
    vehicles,
    bookings,
    issues,
    tasks,
    analytics,
    refreshAll,
  };
}
