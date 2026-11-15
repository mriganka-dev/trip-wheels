"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { differenceInHours, isAfter, parseISO } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Copy,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { AcceptBookingDialog } from "@/components/bookings/accept-booking-dialog";
import { RejectBookingDialog } from "@/components/bookings/reject-booking-dialog";
import { ConfirmVehicleSection } from "@/components/bookings/confirm-vehicle-section";
import { ReportUnavailableDialog } from "@/components/bookings/report-unavailable-dialog";
import { PickupPointSection } from "@/components/bookings/pickup-point-section";
import { ReadinessSection } from "@/components/bookings/readiness-section";
import { HandoverSection } from "@/components/bookings/handover-section";
import { CompleteTripDialog } from "@/components/bookings/complete-trip-dialog";
import { CancelBookingDialog } from "@/components/bookings/cancel-booking-dialog";
import { ModificationRequestsSection } from "@/components/bookings/modification-requests-section";
import { HistorySection } from "@/components/bookings/history-section";
import { useAuth } from "@/hooks/use-auth";
import { getBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { getBookingStatusMeta } from "@/lib/constants";
import {
  formatCurrency,
  formatDateTime,
  formatDurationBetween,
  formatDurationHours,
  formatPhone,
  getTelLink,
} from "@/lib/format";
import type { Booking } from "@/types/booking";

const TERMINAL_STATUSES = [
  "completed",
  "rejected",
  "expired",
  "cancelled_by_customer",
  "cancelled_by_publisher",
  "vehicle_unavailable",
  "handover_declined",
  "no_show",
];

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Booking>({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => getBooking(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 30000;
    },
    refetchOnWindowFocus: true,
  });

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    showToast(`${formatPhone(phone)} copied to clipboard`, "neutral");
  };

  if (isLoading) {
    return (
      <AppShell title="Booking Details">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </AppShell>
    );
  }

  if (isError || !booking) {
    return (
      <AppShell title="Booking Details">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <div>
            <h2 className="text-base font-semibold text-rose-900">
              Failed to load booking
            </h2>
            <p className="text-sm text-rose-700 mt-1">
              {(error as Error)?.message || "The booking could not be found or retrieved."}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push("/bookings")}>
              Back to bookings
            </Button>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const meta = getBookingStatusMeta(booking.status);
  const isRequested = booking.status === "requested";
  const isConfirmed = booking.status === "confirmed";
  const isOngoing = booking.status === "ongoing";

  const now = new Date();
  const startAt = parseISO(booking.startAt);
  const endAt = parseISO(booking.endAt);
  const hoursUntilPickup = differenceInHours(startAt, now);
  const isPastPickup = isAfter(now, startAt);
  const isOverdue = booking.isOverdue || (isOngoing && isAfter(now, endAt));

  // Determine "What you need to do now" copy & action
  let actionTitle = "Status update";
  let actionDescription = "No action required at this moment.";
  let showAcceptRejectInAction = false;

  if (isRequested) {
    actionTitle = "Waiting for your response";
    actionDescription =
      "A customer requested this vehicle. Accept or decline before the response deadline.";
    showAcceptRejectInAction = true;
  } else if (isConfirmed) {
    const isVehicleConfirmed = Boolean(booking.vehicleConfirmation?.confirmedAt);
    const isPickupFinalized = Boolean(booking.pickup?.finalizedAt);
    const isIndividual =
      user?.role === "individual" || booking.pickup?.mode === "flexible";

    if (booking.vehicleConfirmation?.missedAt || (!isVehicleConfirmed && hoursUntilPickup <= 24)) {
      actionTitle = "Confirm the exact vehicle";
      actionDescription =
        "The vehicle confirmation deadline is near or has passed. Confirm the chassis and registration number below.";
    } else if (isIndividual && !isPickupFinalized) {
      actionTitle = "Set exact pickup point";
      actionDescription =
        "Agree the exact pickup location with the customer and save it below so they can find you.";
    } else if (hoursUntilPickup <= 24 && !booking.prePickupConfirmedAt) {
      actionTitle = "Confirm pickup readiness";
      actionDescription =
        "Inspect the vehicle and confirm your readiness for pickup below.";
    } else if (isPastPickup) {
      actionTitle = "Hand over vehicle";
      actionDescription =
        "The customer is scheduled to pick up. Check ID and license below to hand over the vehicle.";
    } else {
      actionTitle = "Upcoming pickup scheduled";
      actionDescription = `Prepare the vehicle for pickup on ${formatDateTime(booking.startAt)}.`;
    }
  } else if (isOngoing) {
    if (isOverdue) {
      actionTitle = "Return time has passed";
      actionDescription =
        "The scheduled return time has passed. Inspect the vehicle and complete the trip below.";
    } else {
      actionTitle = "Vehicle is on trip";
      actionDescription = `Return is scheduled for ${formatDateTime(booking.endAt)}.`;
    }
  } else if (booking.status === "completed") {
    actionTitle = "Trip completed";
    actionDescription = "This trip was successfully completed. No further action needed.";
  } else if (booking.status === "handover_declined") {
    actionTitle = "Handover declined";
    actionDescription =
      "Handover was declined at pickup. Recorded for platform verification.";
  } else if (booking.status === "no_show") {
    actionTitle = "Marked as no show";
    actionDescription = "Customer did not arrive within the grace period.";
  } else if (booking.status === "vehicle_unavailable") {
    actionTitle = "Vehicle reported unavailable";
    actionDescription = "The customer was notified and offered alternative options.";
  } else if (booking.status === "rejected") {
    actionTitle = "Request declined";
    actionDescription = "You declined this booking request.";
  } else if (booking.status === "expired") {
    actionTitle = "Request expired";
    actionDescription = "This request expired without a response.";
  } else if (
    booking.status === "cancelled_by_customer" ||
    booking.status === "cancelled_by_publisher"
  ) {
    actionTitle = "Booking cancelled";
    actionDescription = "This booking was cancelled.";
  }

  return (
    <AppShell title={`Booking ${booking.bookingCode}`}>
      <div className="space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-(--ink-soft) hover:text-(--ink) transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to bookings
          </Link>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>

        {/* Page Header */}
        <header className="rounded-md border border-(--line) bg-(--surface) p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-(--ink-soft)">
                  {booking.bookingCode}
                </span>
              </div>
              <h1 className="text-xl font-bold font-display text-(--ink) mt-1">
                {booking.vehicle.brand} {booking.vehicle.model}
              </h1>
              <p className="text-sm text-(--ink-soft) mt-0.5">
                {formatDateTime(booking.startAt)} to {formatDateTime(booking.endAt)} (
                {formatDurationBetween(booking.startAt, booking.endAt)})
              </p>
            </div>

            {/* Quiet top action buttons on confirmed bookings before handover */}
            {isConfirmed && !isPastPickup && (
              <div className="flex flex-wrap items-center gap-2">
                <ReportUnavailableDialog booking={booking} />
                <CancelBookingDialog booking={booking} />
              </div>
            )}
          </div>

          {/* "What you need to do now" action bar */}
          <div className="mt-5 rounded border border-(--line) bg-(--surface-soft) p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-(--ink-soft)">
                What you need to do now
              </span>
              <p className="text-sm font-medium text-(--ink)">{actionTitle}</p>
              <p className="text-xs text-(--ink-soft)">{actionDescription}</p>
            </div>

            {showAcceptRejectInAction && (
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                <Button
                  size="sm"
                  onClick={() => setIsAcceptOpen(true)}
                  className="bg-(--brand) hover:bg-(--brand-hover) text-white"
                >
                  Accept request
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRejectOpen(true)}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Critical Banners */}
        {booking.vehicleConfirmation?.missedAt && !booking.vehicleConfirmation?.confirmedAt && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">
                The vehicle confirmation deadline has passed. Confirm now.
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                The customer has been notified. Confirm the registration and chassis number below immediately to avoid score penalty.
              </p>
            </div>
          </div>
        )}

        {isOverdue && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">The return time has passed.</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Trips complete automatically a few hours after the return time if nobody marks it. Complete the trip once the vehicle is returned.
              </p>
            </div>
          </div>
        )}

        {booking.hasOpenIssue && (
          <div className="rounded-md border border-rose-300 bg-rose-50 p-4 flex items-start justify-between gap-3 text-rose-900">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" />
              <div className="text-sm">
                <p className="font-semibold">There is an open issue on this booking.</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  An issue was reported by the customer or admin team.
                </p>
              </div>
            </div>
            <Link
              href="/issues"
              className="text-xs font-semibold text-rose-800 underline hover:text-rose-950 shrink-0"
            >
              View issues
            </Link>
          </div>
        )}

        {/* Terminal status explanation banners */}
        {booking.status === "handover_declined" && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">
              Handover was declined for this booking.
            </p>
            <p>
              The reason ({booking.handover?.declined?.reason || "verification failure"}) is recorded for the Admin team and does not count against your reliability score. No further action is needed.
            </p>
          </div>
        )}

        {booking.status === "no_show" && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">
              The customer did not arrive for pickup and this booking was marked as a no-show.
            </p>
            <p>No further action is needed.</p>
          </div>
        )}

        {booking.status === "vehicle_unavailable" && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">
              This vehicle was reported unavailable.
            </p>
            <p>
              The customer was told and alternative vehicles were offered. No further action is needed.
            </p>
          </div>
        )}

        {booking.status === "expired" && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">
              This request expired without a response.
            </p>
            <p>No further action is needed.</p>
          </div>
        )}

        {booking.status === "rejected" && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">You declined this request.</p>
            {booking.rejectionReason && (
              <p>Reason recorded: {booking.rejectionReason}</p>
            )}
            <p>No further action is needed.</p>
          </div>
        )}

        {(booking.status === "cancelled_by_customer" ||
          booking.status === "cancelled_by_publisher") && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">This booking has been cancelled.</p>
            {booking.cancellation?.reason && (
              <p>Reason: {booking.cancellation.reason}</p>
            )}
            <p>No further action is needed.</p>
          </div>
        )}

        {booking.status === "completed" && (
          <div className="rounded-md border border-(--line) bg-(--surface-soft) p-4 text-xs text-(--ink-soft) space-y-1">
            <p className="font-medium text-(--ink)">
              This trip is completed and closed.
            </p>
            <p>No further action is needed.</p>
          </div>
        )}

        {/* Section: Response Deadline (if requested) */}
        {isRequested && booking.responseDeadlineAt && (
          <section className="rounded-md border border-(--brand) bg-(--brand)/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-(--brand)">
                  Response Deadline
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-5 h-5 text-(--brand)" />
                  <Countdown
                    deadline={booking.responseDeadlineAt}
                    className="text-lg font-bold font-display text-(--brand)"
                  />
                </div>
                <p className="text-xs text-(--ink-soft) mt-1">
                  Deadline: {formatDateTime(booking.responseDeadlineAt)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsAcceptOpen(true)}
                  className="bg-(--brand) hover:bg-(--brand-hover) text-white"
                >
                  Accept request
                </Button>
                <Button variant="secondary" onClick={() => setIsRejectOpen(true)}>
                  Decline request
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Section: Pending Date Change Requests */}
        <ModificationRequestsSection booking={booking} />

        {/* Section: Customer Information */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6">
          <div className="pb-4 border-b border-(--line)">
            <h2 className="text-base font-semibold text-(--ink)">Customer</h2>
            <p className="text-sm text-(--ink-soft) mt-0.5">
              Contact and verification details for this traveler.
            </p>
          </div>

          <div className="mt-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Full name
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.customer?.fullName || "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Phone number
                </dt>
                <dd className="mt-0.5">
                  {booking.customer?.phone ? (
                    <div className="flex items-center gap-3">
                      <a
                        href={getTelLink(booking.customer.phone)}
                        className="font-medium text-(--brand) hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {formatPhone(booking.customer.phone)}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(booking.customer!.phone!)}
                        className="inline-flex items-center gap-1 text-xs text-(--ink-soft) hover:text-(--ink) border border-(--line) rounded px-2 py-0.5"
                        aria-label="Copy phone number"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-(--ink-soft) italic">
                      Available after you accept
                    </span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Customer reliability
                </dt>
                <dd className="text-(--ink) mt-0.5">
                  {booking.customer?.reliability?.score != null ? (
                    <span>
                      Score: {booking.customer.reliability.score} (
                      {booking.customer.reliability.completedTrips || 0} completed trips)
                    </span>
                  ) : (
                    <span className="text-(--ink-soft)">New traveler</span>
                  )}
                </dd>
              </div>

              {booking.customerNote && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                    Customer note
                  </dt>
                  <dd className="text-(--ink) mt-0.5 bg-(--surface-soft) p-3 rounded border border-(--line)">
                    &quot;{booking.customerNote}&quot;
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* Section: Dates and Vehicle */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6">
          <div className="pb-4 border-b border-(--line)">
            <h2 className="text-base font-semibold text-(--ink)">
              Dates and vehicle
            </h2>
            <p className="text-sm text-(--ink-soft) mt-0.5">
              Scheduled window, vehicle model, and informational pricing estimate.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Pickup time
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {formatDateTime(booking.startAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Return time
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {formatDateTime(booking.endAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Booked vehicle
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.vehicle.brand} {booking.vehicle.model} ({booking.vehicle.type})
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Assigned vehicle
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.assignedVehicle
                    ? `${booking.assignedVehicle.brand} ${booking.assignedVehicle.model}`
                    : `${booking.vehicle.brand} ${booking.vehicle.model}`}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Total rental duration
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.durationHours
                    ? formatDurationHours(booking.durationHours)
                    : formatDurationBetween(booking.startAt, booking.endAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider font-medium text-(--ink-soft)">
                  Informational total
                </dt>
                <dd className="font-medium text-(--ink) mt-0.5">
                  {booking.pricingSnapshot?.estimatedTotal != null
                    ? formatCurrency(booking.pricingSnapshot.estimatedTotal)
                    : "To be confirmed"}
                </dd>
              </div>
            </dl>

            <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
              You collect the rent from the customer at pickup. Trip Wheels does not collect or process rental payments.
            </div>
          </div>
        </section>

        {/* Section: Pickup point (shown for confirmed and later) */}
        {!isRequested && (
          <PickupPointSection
            booking={booking}
            userRole={user?.role}
            onSuccess={() => refetch()}
          />
        )}

        {/* Section: Confirm exact vehicle (shown when confirmed, before handover) */}
        {isConfirmed && (
          <ConfirmVehicleSection booking={booking} onSuccess={() => refetch()} />
        )}

        {/* Section: Pickup readiness (shown when confirmed, within 24h of pickup) */}
        {isConfirmed && hoursUntilPickup <= 24 && (
          <ReadinessSection booking={booking} onSuccess={() => refetch()} />
        )}

        {/* Section: Handover (shown when confirmed, at or near pickup) */}
        {isConfirmed && (
          <HandoverSection booking={booking} onSuccess={() => refetch()} />
        )}

        {/* Section: Complete trip (shown when ongoing) */}
        {isOngoing && (
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-(--ink)">
                  Complete trip
                </h2>
                <p className="text-sm text-(--ink-soft) mt-0.5">
                  Once the customer returns the vehicle and keys, mark the trip complete.
                </p>
              </div>
              <CompleteTripDialog booking={booking} onSuccess={() => refetch()} />
            </div>
          </section>
        )}

        {/* Section: Activity History (always) */}
        <HistorySection
          statusHistory={booking.statusHistory}
          createdAt={booking.createdAt}
        />
      </div>

      {/* Accept & Reject Dialogs */}
      <AcceptBookingDialog
        booking={booking}
        isOpen={isAcceptOpen}
        onClose={() => setIsAcceptOpen(false)}
        userRole={user?.role}
        onSuccess={() => refetch()}
      />

      <RejectBookingDialog
        booking={booking}
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onSuccess={() => refetch()}
      />
    </AppShell>
  );
}
