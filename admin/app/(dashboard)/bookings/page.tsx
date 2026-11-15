"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  differenceInSeconds,
  parseISO,
} from "date-fns";
import {
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcceptBookingDialog } from "@/components/bookings/accept-booking-dialog";
import { RejectBookingDialog } from "@/components/bookings/reject-booking-dialog";
import { useAuth } from "@/hooks/use-auth";
import { getReceivedBookings } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { getBookingStatusMeta } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Booking } from "@/types/booking";

type TabId = "requests" | "upcoming" | "ongoing" | "past" | "closed";

const TAB_CONFIG: { id: TabId; label: string; statuses: string[] }[] = [
  { id: "requests", label: "Requests", statuses: ["requested"] },
  { id: "upcoming", label: "Upcoming", statuses: ["confirmed"] },
  { id: "ongoing", label: "On trip", statuses: ["ongoing"] },
  {
    id: "past",
    label: "Past",
    statuses: ["completed", "no_show", "handover_declined"],
  },
  {
    id: "closed",
    label: "Closed",
    statuses: [
      "rejected",
      "expired",
      "cancelled_by_customer",
      "cancelled_by_publisher",
      "vehicle_unavailable",
    ],
  },
];

const ITEMS_PER_PAGE = 10;

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const tabQuery = (searchParams.get("tab") as TabId) || "requests";
  const [selectedTab, setSelectedTab] = useState<TabId>(tabQuery);
  const [page, setPage] = useState<number>(1);

  // Dialog states for action buttons
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    document.title = "Bookings | Trip Wheels Partner";
  }, []);

  // Sync tab with URL query parameter
  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as TabId;
    setSelectedTab(nextTab);
    setPage(1);
    router.replace(`/bookings?tab=${nextTab}`);
  };

  // Poll every 30 seconds when requests tab is open
  const isRequestsTab = selectedTab === "requests";
  const refetchInterval = isRequestsTab ? 30000 : false;

  const {
    data: bookingsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bookings.received({ limit: 100 }),
    queryFn: () => getReceivedBookings({ limit: 100 }),
    refetchInterval,
  });

  const allItems: Booking[] = useMemo(
    () => bookingsData?.items || [],
    [bookingsData?.items]
  );

  // Filter items matching active tab
  const currentTabStatuses = useMemo(() => {
    const tabObj = TAB_CONFIG.find((t) => t.id === selectedTab);
    return tabObj ? tabObj.statuses : ["requested"];
  }, [selectedTab]);

  const filteredItems = useMemo(() => {
    const matched = allItems.filter((b) =>
      currentTabStatuses.includes(b.status)
    );

    // If on requests tab: sort by earliest response deadline
    if (selectedTab === "requests") {
      return [...matched].sort((a, b) => {
        const da = a.responseDeadlineAt ? parseISO(a.responseDeadlineAt).getTime() : 0;
        const db = b.responseDeadlineAt ? parseISO(b.responseDeadlineAt).getTime() : 0;
        return da - db;
      });
    }

    // Default: sort newest first
    return matched;
  }, [allItems, currentTabStatuses, selectedTab]);

  // Tab counters
  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = {
      requests: 0,
      upcoming: 0,
      ongoing: 0,
      past: 0,
      closed: 0,
    };

    allItems.forEach((b) => {
      TAB_CONFIG.forEach((tab) => {
        if (tab.statuses.includes(b.status)) {
          counts[tab.id]++;
        }
      });
    });

    return counts;
  }, [allItems]);

  // Client-side pagination for the active tab list
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  return (
    <AppShell
      title="Bookings"
      subtitle="Customer requests, upcoming reservations and trip history."
    >
      <div className="flex flex-col gap-6">
        {/* Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <span>{tab.label}</span>
                {tabCounts[tab.id] > 0 && (
                  <span
                    className={clsx(
                      "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                      tab.id === "requests"
                        ? "bg-(--brand) text-white"
                        : "bg-(--line) text-(--ink)"
                    )}
                  >
                    {tabCounts[tab.id]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="p-4 rounded-md border border-(--line) bg-(--surface) flex items-center justify-between"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
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
                <p className="font-semibold">Failed to load bookings.</p>
                <p className="mt-0.5 text-(--ink-soft)">
                  Please check your connection and try again.
                </p>
              </div>
            </div>
            <Button variant="quiet" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && paginatedItems.length === 0 && (
          <EmptyState
            title={`No ${selectedTab} bookings`}
            description={
              selectedTab === "requests"
                ? "You have no new requests waiting for a reply right now."
                : `There are no bookings in the ${selectedTab} list.`
            }
          />
        )}

        {/* Bookings Table on Desktop */}
        {!isLoading && !isError && paginatedItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="hidden md:block overflow-x-auto rounded-md border border-(--line) bg-(--surface)">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-(--line) bg-(--paper) text-(--ink-soft)">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">
                      Dates
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right">
                      {selectedTab === "requests" ? "Time left / Action" : "Next action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--line)">
                  {paginatedItems.map((b) => {
                    const meta = getBookingStatusMeta(b.status);
                    const vName = `${b.vehicle.brand} ${b.vehicle.model}`;
                    const cName = b.customer?.fullName || "Customer";
                    const isRequest = b.status === "requested";

                    const isExpired = b.responseDeadlineAt
                      ? differenceInSeconds(parseISO(b.responseDeadlineAt), new Date()) <= 0
                      : false;

                    return (
                      <tr
                        key={b._id}
                        className="transition-colors hover:bg-(--brand-tint)/10 cursor-pointer"
                        onClick={() => router.push(`/bookings/${b._id}`)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-(--brand)">
                          {b.bookingCode}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-(--ink)">{cName}</p>
                          <p className="text-[11px] text-(--ink-soft)">
                            {b.customer?.phone
                              ? b.customer.phone
                              : "Phone available after accept"}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-(--ink)">{vName}</p>
                          <p className="text-[11px] text-(--ink-soft) capitalize">
                            {b.vehicle.type}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-(--ink)">
                          <p>
                            {formatDate(b.startAt)} to {formatDate(b.endAt)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </td>

                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isRequest ? (
                            <div className="flex items-center justify-end gap-2">
                              {b.responseDeadlineAt && !isExpired && (
                                <span className="font-semibold text-amber-800 text-[11px] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <Countdown deadline={b.responseDeadlineAt} />
                                </span>
                              )}

                              {isExpired ? (
                                <span className="text-xs font-semibold text-(--negative)">
                                  Expired, no reply
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setActionBooking(b);
                                      setIsRejectOpen(true);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                      setActionBooking(b);
                                      setIsAcceptOpen(true);
                                    }}
                                  >
                                    Accept
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link href={`/bookings/${b._id}`}>
                              <Button variant="quiet" size="sm">
                                View details
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Rows (under 768px) */}
            <div className="flex flex-col gap-3 md:hidden">
              {paginatedItems.map((b) => {
                const meta = getBookingStatusMeta(b.status);
                const vName = `${b.vehicle.brand} ${b.vehicle.model}`;
                const cName = b.customer?.fullName || "Customer";
                const isRequest = b.status === "requested";

                const isExpired = b.responseDeadlineAt
                  ? differenceInSeconds(parseISO(b.responseDeadlineAt), new Date()) <= 0
                  : false;

                return (
                  <div
                    key={b._id}
                    className="p-4 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-(--line) pb-2">
                      <Link
                        href={`/bookings/${b._id}`}
                        className="font-mono text-xs font-bold text-(--brand) hover:underline"
                      >
                        {b.bookingCode}
                      </Link>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-1 text-xs">
                      <p className="text-sm font-semibold text-(--ink)">{vName}</p>
                      <p className="text-(--ink-soft)">
                        Customer: <strong className="text-(--ink)">{cName}</strong>
                      </p>
                      <p className="text-(--ink-soft) flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-(--brand)" />
                        <span>
                          {formatDate(b.startAt)} to {formatDate(b.endAt)}
                        </span>
                      </p>

                      {/* Customer Note if present */}
                      {b.customerNote && (
                        <p className="p-2 rounded bg-(--paper) text-[11px] text-(--ink-soft) italic mt-1">
                          &quot;{b.customerNote}&quot;
                        </p>
                      )}

                      {/* Phone note */}
                      <p className="text-[11px] text-(--ink-soft) mt-1">
                        Phone:{" "}
                        {b.customer?.phone ? (
                          <a
                            href={`tel:${b.customer.phone}`}
                            className="font-medium text-(--brand) underline"
                          >
                            {b.customer.phone}
                          </a>
                        ) : (
                          "Available after you accept"
                        )}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-(--line) flex items-center justify-between gap-2">
                      {isRequest && b.responseDeadlineAt && !isExpired && (
                        <span className="font-semibold text-amber-800 text-xs flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <Countdown deadline={b.responseDeadlineAt} />
                        </span>
                      )}

                      {isRequest && isExpired && (
                        <span className="text-xs font-semibold text-(--negative)">
                          Expired, no reply
                        </span>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {isRequest && !isExpired ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setActionBooking(b);
                                setIsRejectOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setActionBooking(b);
                                setIsAcceptOpen(true);
                              }}
                            >
                              Accept
                            </Button>
                          </>
                        ) : (
                          <Link href={`/bookings/${b._id}`}>
                            <Button variant="quiet" size="sm">
                              View booking
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}

        {/* Accept Booking Dialog */}
        <AcceptBookingDialog
          booking={actionBooking}
          isOpen={isAcceptOpen}
          onClose={() => {
            setIsAcceptOpen(false);
            setActionBooking(null);
          }}
          userRole={user?.role}
        />

        {/* Reject Booking Dialog */}
        <RejectBookingDialog
          booking={actionBooking}
          isOpen={isRejectOpen}
          onClose={() => {
            setIsRejectOpen(false);
            setActionBooking(null);
          }}
        />
      </div>
    </AppShell>
  );
}
