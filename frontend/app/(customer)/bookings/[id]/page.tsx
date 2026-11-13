"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getBookingById } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { BOOKING_STATUS_CONFIG, type BookingStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { Booking } from "@/types/booking";

import { BookingStatusTracker } from "@/components/booking/booking-status-tracker";
import { ResponseCountdown } from "@/components/booking/response-countdown";
import { BackupVehiclesList } from "@/components/booking/backup-vehicles-list";
import { OwnerContact } from "@/components/booking/owner-contact";
import { PickupDetails } from "@/components/booking/pickup-details";
import { VehicleDetailsCard } from "@/components/booking/vehicle-details-card";
import { PickupChecklist } from "@/components/booking/pickup-checklist";
import { WhatToCarry } from "@/components/booking/what-to-carry";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { BookingHistoryCard } from "@/components/booking/booking-history-card";
import { BookingBanners } from "@/components/booking/booking-banners";

import { CancelBookingDialog } from "@/components/booking/cancel-booking-dialog";
import { DateChangeDialog } from "@/components/booking/date-change-dialog";
import { PickupConfirmDialog } from "@/components/booking/pickup-confirm-dialog";
import { CompleteTripDialog } from "@/components/booking/complete-trip-dialog";

const TERMINAL_STATUSES: BookingStatus[] = [
  "rejected",
  "expired",
  "cancelled_by_customer",
  "cancelled_by_publisher",
  "vehicle_unavailable",
  "handover_declined",
  "no_show",
  "completed",
];

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDateChangeOpen, setIsDateChangeOpen] = useState(false);
  const [isPickupConfirmOpen, setIsPickupConfirmOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => getBookingById(id),
    refetchInterval: (query) => {
      const current = query.state.data;
      if (!current) return false;
      const isTerminal = TERMINAL_STATUSES.includes(current.status);
      return isTerminal ? false : 30000;
    },
    refetchOnWindowFocus: true,
  });

  const handleBookingUpdated = (updated: Booking) => {
    queryClient.setQueryData(queryKeys.bookings.detail(id), updated);
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
  };

  if (isLoading) {
    return (
      <div className="py-8 sm:py-12">
        <Container size="default">
          <div className="space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="py-12">
        <Container size="default">
          <ErrorState
            title="Unable to load booking"
            message={error instanceof Error ? error.message : "The requested booking could not be found."}
            onRetry={() => {
              router.push("/bookings");
            }}
          />
        </Container>
      </div>
    );
  }

  const { status, vehicle, assignedVehicle, vehicleConfirmation } = booking;
  const statusMeta = BOOKING_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  const isConfirmedOrLater = [
    "confirmed",
    "ongoing",
    "completed",
    "handover_declined",
    "no_show",
  ].includes(status);

  const isVehicleMissed =
    Boolean(vehicleConfirmation?.missedAt) &&
    !Boolean(vehicleConfirmation?.confirmedAt);

  const shouldShowBackups =
    status === "vehicle_unavailable" ||
    status === "requested" ||
    status === "rejected" ||
    status === "expired" ||
    status === "cancelled_by_publisher" ||
    (status === "confirmed" && isVehicleMissed);

  // Pending modification request
  const pendingModRequest = booking.modificationRequests?.find(
    (m) => m.status === "pending"
  );
  const latestDecidedModRequest = booking.modificationRequests
    ?.filter((m) => m.status !== "pending")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const activeVehicle = assignedVehicle || vehicle;

  return (
    <div className="py-6 sm:py-10">
      <Container size="default">
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Bookings
          </Link>
        </div>

        {/* Page Header */}
        <header className="rounded-lg border border-line bg-paper-card p-5 sm:p-6 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Booking {booking.bookingCode}
                </span>
                {vehicle?.destination?.name && (
                  <>
                    <span className="text-ink-muted text-xs">•</span>
                    <span className="text-xs text-ink-muted">
                      {vehicle.destination.name}
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-ink">
                {activeVehicle.brand} {activeVehicle.model} ({activeVehicle.year})
              </h1>
            </div>

            <div>
              <Badge tone={statusMeta.tone}>
                {statusMeta.label}
              </Badge>
            </div>
          </div>
        </header>

        {/* Progress Tracker */}
        <div className="mb-6">
          <BookingStatusTracker booking={booking} />
        </div>

        {/* Banners */}
        <div className="mb-6">
          <BookingBanners booking={booking} />
        </div>

        {/* Date modification request notice */}
        {pendingModRequest && (
          <div className="mb-6 rounded-lg border border-line bg-paper-light p-4 text-xs">
            <div className="flex items-start gap-2.5">
              <svg
                className="h-5 w-5 shrink-0 text-brand mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
              </svg>
              <div>
                <p className="font-semibold text-sm text-ink">
                  Date Change Request Pending
                </p>
                <p className="mt-0.5 text-ink leading-relaxed">
                  You requested new trip dates from {formatDateTime(pendingModRequest.newStartAt)} to {formatDateTime(pendingModRequest.newEndAt)}. Waiting for the owner to review and respond.
                </p>
              </div>
            </div>
          </div>
        )}

        {latestDecidedModRequest && !pendingModRequest && (
          <div className="mb-6 rounded-lg border border-line bg-paper-card p-3.5 text-xs text-ink-muted">
            <strong className="font-semibold text-ink">
              Recent Date Request ({latestDecidedModRequest.status}):
            </strong>{" "}
            {latestDecidedModRequest.status === "accepted"
              ? "Your request to modify booking dates was approved by the owner."
              : "Your request to modify booking dates was declined by the owner."}
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main content column (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* If vehicle_unavailable, show other options first as requested */}
            {status === "vehicle_unavailable" && (
              <BackupVehiclesList
                bookingId={booking._id}
                startAt={booking.startAt}
                endAt={booking.endAt}
              />
            )}

            {/* Response Countdown for requested status */}
            {status === "requested" && booking.responseDeadlineAt && (
              <ResponseCountdown deadline={booking.responseDeadlineAt} />
            )}

            {/* Owner Contact (when phone is provided) */}
            {booking.publisher?.phone && (
              <OwnerContact
                ownerName={booking.publisher.fullName}
                phone={booking.publisher.phone}
              />
            )}

            {/* Pickup Details (confirmed and later) */}
            {isConfirmedOrLater && booking.pickup && (
              <PickupDetails pickup={booking.pickup} />
            )}

            {/* Vehicle Details Card (confirmed and later) */}
            {isConfirmedOrLater && (
              <VehicleDetailsCard
                vehicle={vehicle}
                assignedVehicle={assignedVehicle}
                confirmation={vehicleConfirmation}
              />
            )}

            {/* Pickup Checklist (when vehicle confirmed and status is confirmed) */}
            {status === "confirmed" && vehicleConfirmation?.confirmedAt && (
              <PickupChecklist bookingId={booking._id} />
            )}

            {/* What to Carry (confirmed or ongoing) */}
            {(status === "confirmed" || status === "ongoing") && (
              <WhatToCarry />
            )}

            {/* Other Options / Backups (when not already shown above for vehicle_unavailable) */}
            {shouldShowBackups && status !== "vehicle_unavailable" && (
              <BackupVehiclesList
                bookingId={booking._id}
                startAt={booking.startAt}
                endAt={booking.endAt}
              />
            )}

            {/* Booking Summary */}
            <BookingSummaryCard booking={booking} />

            {/* History */}
            <BookingHistoryCard history={booking.statusHistory} />
          </div>

          {/* Sidebar / Action Panel (1 col) */}
          <div className="space-y-6">
            <div className="rounded-lg border border-line bg-paper-card p-5 sticky top-20">
              <h3 className="font-serif text-base font-bold text-ink">
                Booking Actions
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Available actions based on your current booking status.
              </p>

              <div className="mt-4 space-y-2.5">
                {/* Pickup Action (confirmed) */}
                {status === "confirmed" && (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => setIsPickupConfirmOpen(true)}
                  >
                    I have picked up the vehicle
                  </Button>
                )}

                {/* Complete Action (ongoing) */}
                {status === "ongoing" && (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => setIsCompleteOpen(true)}
                  >
                    Complete trip
                  </Button>
                )}

                {/* Review Link (completed) */}
                {status === "completed" && (
                  <Link href={`/bookings/${booking._id}/review`} className="block">
                    <Button variant="primary" size="md" className="w-full">
                      Leave a review
                    </Button>
                  </Link>
                )}

                {/* Date Change Request (confirmed, before pickup) */}
                {status === "confirmed" && (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => setIsDateChangeOpen(true)}
                  >
                    Request a date change
                  </Button>
                )}

                {/* Cancel Booking (requested or confirmed, before pickup) */}
                {(status === "requested" || status === "confirmed") && (
                  <Button
                    variant="quiet"
                    size="md"
                    className="w-full text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                    onClick={() => setIsCancelOpen(true)}
                  >
                    Cancel booking
                  </Button>
                )}

                {/* Report an Issue (Plan 7) */}
                <div className="pt-2 border-t border-line">
                  <Link href={`/bookings/${booking._id}/issue`} className="block">
                    <Button
                      variant="quiet"
                      size="sm"
                      className="w-full text-xs text-ink-muted hover:text-ink"
                    >
                      Report an issue
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Offline payment reminder */}
              <div className="mt-4 rounded-md border border-line bg-paper-light p-3 text-xs text-ink-muted">
                <span className="font-semibold text-ink block mb-0.5">
                  Payment reminder:
                </span>
                Pay directly to the owner at vehicle handover via cash or UPI.
              </div>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <CancelBookingDialog
          booking={booking}
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          onSuccess={handleBookingUpdated}
        />

        <DateChangeDialog
          booking={booking}
          isOpen={isDateChangeOpen}
          onClose={() => setIsDateChangeOpen(false)}
          onSuccess={handleBookingUpdated}
        />

        <PickupConfirmDialog
          booking={booking}
          isOpen={isPickupConfirmOpen}
          onClose={() => setIsPickupConfirmOpen(false)}
          onSuccess={handleBookingUpdated}
        />

        <CompleteTripDialog
          booking={booking}
          isOpen={isCompleteOpen}
          onClose={() => setIsCompleteOpen(false)}
          onSuccess={handleBookingUpdated}
        />
      </Container>
    </div>
  );
}
