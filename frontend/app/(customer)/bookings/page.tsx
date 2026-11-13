"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingListItem } from "@/components/booking/booking-list-item";
import { getMyBookings } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import type { BookingStatus } from "@/lib/constants";
import type { Booking } from "@/types/booking";

const UPCOMING_STATUSES: BookingStatus[] = ["requested", "confirmed", "ongoing"];
const PAST_STATUSES: BookingStatus[] = ["completed", "no_show", "handover_declined"];
const CLOSED_STATUSES: BookingStatus[] = [
  "rejected",
  "expired",
  "cancelled_by_customer",
  "cancelled_by_publisher",
  "vehicle_unavailable",
];

export default function MyBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bookings.mine(),
    queryFn: () => getMyBookings(1, 50),
    refetchInterval: (query) => {
      const items = query.state.data?.items || [];
      const hasPending = items.some((b: Booking) => b.status === "requested");
      return hasPending ? 60000 : false;
    },
    refetchOnWindowFocus: true,
  });

  const allBookings = data?.items || [];

  const upcomingBookings = allBookings.filter((b) =>
    UPCOMING_STATUSES.includes(b.status)
  );
  const pastBookings = allBookings.filter((b) =>
    PAST_STATUSES.includes(b.status)
  );
  const closedBookings = allBookings.filter((b) =>
    CLOSED_STATUSES.includes(b.status)
  );

  return (
    <main className="py-10 bg-(--paper) min-h-screen">
      <Container size="narrow">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Account Activity
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-display text-(--ink)">
            My bookings
          </h1>
          <p className="mt-1 text-xs text-(--ink-soft)">
            Track your vehicle requests, view confirmations and review past journeys.
          </p>
        </div>

        {isError && (
          <ErrorState
            title="Unable to load bookings"
            message={
              error instanceof Error
                ? error.message
                : "A network issue prevented loading your bookings."
            }
            onRetry={() => refetch()}
          />
        )}

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {!isLoading && !isError && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming & active ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past trips ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({closedBookings.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Upcoming and active */}
            <TabsContent value="upcoming">
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  title="No active bookings"
                  description="You do not have any requested or confirmed trips right now."
                  actionLabel="Find a vehicle"
                  onAction={() => {
                    router.push("/destinations");
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingListItem key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Past trips */}
            <TabsContent value="past">
              {pastBookings.length === 0 ? (
                <EmptyState
                  title="No completed trips"
                  description="Completed rentals and past travel history will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingListItem key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Closed bookings */}
            <TabsContent value="closed">
              {closedBookings.length === 0 ? (
                <EmptyState
                  title="No closed requests"
                  description="Cancelled, rejected or expired requests will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {closedBookings.map((booking) => (
                    <BookingListItem key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </Container>
    </main>
  );
}
