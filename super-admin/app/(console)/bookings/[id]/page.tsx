"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OsmMap } from "@/components/maps/osm-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DefinitionList } from "@/components/ui/definition-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/use-page-title";
import { getBookingById, overrideBookingStatus } from "@/lib/api/bookings";
import { getBookingStatusMeta } from "@/lib/constants";
import {
  formatCurrency,
  formatDateTime,
  formatPhone,
} from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { BookingStatus } from "@/types/bookings";

const STATUS_EXPLANATIONS: Record<string, string> = {
  requested: "The customer submitted this request and is awaiting the owner's response.",
  confirmed: "The owner accepted this booking; vehicle confirmation and handover are scheduled.",
  rejected: "The owner rejected this booking request.",
  expired: "The owner did not respond before the deadline expired.",
  cancelled_by_customer: "The customer cancelled this booking.",
  cancelled_by_publisher: "The owner cancelled this confirmed booking.",
  vehicle_unavailable: "The owner reported the vehicle as unavailable.",
  handover_declined: "The owner declined handover because requirements were not met.",
  no_show: "The customer did not show up for pickup.",
  ongoing: "The vehicle was handed over and the trip is currently active.",
  completed: "The vehicle was returned and the booking is completed.",
};

const TERMINAL_STATUSES: BookingStatus[] = [
  "completed",
  "rejected",
  "expired",
  "cancelled_by_customer",
  "cancelled_by_publisher",
  "vehicle_unavailable",
  "handover_declined",
  "no_show",
];

const OVERRIDE_STATUS_OPTIONS = [
  { label: "Requested", value: "requested" },
  { label: "Confirmed", value: "confirmed" },
  { label: "On trip", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Rejected by owner", value: "rejected" },
  { label: "Cancelled by customer", value: "cancelled_by_customer" },
  { label: "Cancelled by owner", value: "cancelled_by_publisher" },
  { label: "Vehicle unavailable", value: "vehicle_unavailable" },
  { label: "Handover declined", value: "handover_declined" },
  { label: "No show", value: "no_show" },
  { label: "Expired", value: "expired" },
];

export default function BookingDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const bookingId = params?.id as string;

  // Status override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>("confirmed");
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Query booking detail
  const bookingQuery = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => getBookingById(bookingId),
    enabled: Boolean(bookingId),
    refetchInterval: (query) => {
      const b = query.state.data;
      if (b && TERMINAL_STATUSES.includes(b.status)) {
        return false;
      }
      return 60000;
    },
    refetchOnWindowFocus: true,
  });

  const booking = bookingQuery.data;
  usePageTitle(booking ? `Booking: ${booking.bookingCode}` : "Booking Detail");

  // Mutation for admin status override
  const overrideMutation = useMutation({
    mutationFn: () =>
      overrideBookingStatus(bookingId, {
        status: targetStatus,
        note: overrideNote.trim(),
      }),
    onSuccess: () => {
      showToast("Booking status overridden successfully", "brand");
      setOverrideDialogOpen(false);
      setOverrideNote("");
      setOverrideError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
    },
    onError: (err: Error) => {
      setOverrideError(err.message || "Failed to override booking status");
    },
  });

  const handleOpenOverride = () => {
    if (booking) {
      setTargetStatus(booking.status);
    }
    setOverrideNote("");
    setOverrideError(null);
    setOverrideDialogOpen(true);
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideNote.trim().length < 10) {
      setOverrideError("A detailed note of at least 10 characters is required for status override.");
      return;
    }
    setOverrideError(null);
    overrideMutation.mutate();
  };

  if (bookingQuery.isLoading) {
    return (
      <AppShell title="Booking Details">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell title="Booking Details">
        <EmptyState
          title="Booking not found"
          description="The requested booking could not be loaded or has been deleted."
          action={
            <Link href="/bookings">
              <Button variant="secondary">Back to Bookings</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const statusMeta = getBookingStatusMeta(booking.status);
  const statusExplanation = STATUS_EXPLANATIONS[booking.status] || "Status managed on platform.";

  const isSwapped =
    booking.assignedVehicle &&
    booking.vehicle &&
    booking.assignedVehicle._id !== booking.vehicle._id;

  const historyList = [...(booking.statusHistory || [])].sort((a, b) => {
    return new Date(a.at).getTime() - new Date(b.at).getTime();
  });

  return (
    <AppShell
      title={`Booking: ${booking.bookingCode}`}
      contextLine={`Status: ${statusMeta.label} | Code: ${booking.bookingCode}`}
    >
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Bookings
          </Link>
        </div>

        {/* 1. Summary */}
        <section className="bg-surface border border-line rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
              1. Summary
            </h2>
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          </div>

          <DefinitionList className="mt-3">
            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Booking Code</dt>
              <dd className="mt-1 text-sm font-mono font-bold text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                <span>{booking.bookingCode}</span>
                <CopyButton value={booking.bookingCode} label="Copy code" />
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Status Explanation</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 font-medium">
                {statusExplanation}
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Pickup & Return</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 space-y-1">
                <p>
                  Start: <strong>{formatDateTime(booking.startAt)}</strong>
                </p>
                <p>
                  End: <strong>{formatDateTime(booking.endAt)}</strong>
                </p>
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Trip Duration</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                {booking.durationHours} hours
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Informational Estimate</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 space-y-1">
                <p>
                  Estimated Total:{" "}
                  <strong>{formatCurrency(booking.pricingSnapshot?.estimatedTotal)}</strong>{" "}
                  ({formatCurrency(booking.pricingSnapshot?.perDay)}/day,{" "}
                  {formatCurrency(booking.pricingSnapshot?.deposit)} deposit)
                </p>
                <p className="text-xs text-ink-soft italic font-medium">
                  No money is handled on the platform.
                </p>
              </dd>
            </div>

            {booking.customerNote && (
              <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                <dt className="text-xs text-ink-soft font-medium">Customer Note</dt>
                <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 italic">
                  &ldquo;{booking.customerNote}&rdquo;
                </dd>
              </div>
            )}
          </DefinitionList>
        </section>

        {/* 2. People */}
        <section className="bg-surface border border-line rounded p-5">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
            2. People
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
            {/* Customer */}
            <div className="p-4 bg-paper rounded border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-ink-soft">Customer</span>
                <span className="text-xs font-semibold text-brand">
                  Reliability: {booking.customer?.reliability?.score ?? 100}/100
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-ink">{booking.customer?.fullName || "Customer"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {booking.customer?.phone ? (
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={`tel:${booking.customer.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-brand font-mono hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {formatPhone(booking.customer.phone)}
                      </a>
                      <CopyButton value={booking.customer.phone} label="Copy customer phone" />
                    </div>
                  ) : (
                    <span className="text-xs text-ink-soft">No phone recorded</span>
                  )}
                </div>
                <p className="text-xs text-ink-soft mt-0.5">{booking.customer?.email}</p>
              </div>

              {booking.customer?._id && (
                <Link
                  href={`/users`}
                  className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline pt-1"
                >
                  <span>View customer record</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Owner */}
            <div className="p-4 bg-paper rounded border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-ink-soft">Owner / Partner</span>
                <span className="text-xs font-semibold text-brand">
                  Reliability: {booking.publisher?.reliability?.score ?? 100}/100
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-ink">{booking.publisher?.fullName || "Owner"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {booking.publisher?.phone ? (
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={`tel:${booking.publisher.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-brand font-mono hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {formatPhone(booking.publisher.phone)}
                      </a>
                      <CopyButton value={booking.publisher.phone} label="Copy owner phone" />
                    </div>
                  ) : (
                    <span className="text-xs text-ink-soft">No phone recorded</span>
                  )}
                </div>
                <p className="text-xs text-ink-soft mt-0.5">{booking.publisher?.email}</p>
              </div>

              {booking.publisher?._id && (
                <Link
                  href={`/verifications`}
                  className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline pt-1"
                >
                  <span>View owner profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* 3. Vehicle */}
        <section className="bg-surface border border-line rounded p-5">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
            3. Vehicle Allocation
          </h2>

          <DefinitionList className="mt-3">
            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Booked Vehicle</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center justify-between">
                <div>
                  <span className="font-semibold">{booking.vehicle?.brand} {booking.vehicle?.model}</span>
                  <span className="text-xs font-mono text-ink-soft ml-2">
                    ({booking.vehicle?.registrationNumber || "Reg not recorded"})
                  </span>
                </div>
                {booking.vehicle?._id && (
                  <Link
                    href={`/vehicles/${booking.vehicle._id}`}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Review vehicle
                  </Link>
                )}
              </dd>
            </div>

            {isSwapped && (
              <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline bg-[#FEF6E9] p-3 rounded">
                <dt className="text-xs text-warning font-semibold">Assigned Vehicle (Swapped)</dt>
                <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-ink">
                      {booking.assignedVehicle?.brand} {booking.assignedVehicle?.model}
                    </span>
                    <span className="text-xs font-mono text-ink-soft ml-2">
                      ({booking.assignedVehicle?.registrationNumber || "Reg not recorded"})
                    </span>
                    <p className="text-xs text-warning mt-0.5">
                      Notice: Owner allocated an alternative vehicle prior to journey start.
                    </p>
                  </div>
                  {booking.assignedVehicle?._id && (
                    <Link
                      href={`/vehicles/${booking.assignedVehicle._id}`}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Review assigned vehicle
                    </Link>
                  )}
                </dd>
              </div>
            )}
          </DefinitionList>
        </section>

        {/* 4. Pickup Location */}
        <section className="bg-surface border border-line rounded p-5">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
            4. Pickup Location
          </h2>

          <div className="space-y-4 mt-3">
            <DefinitionList>
              <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                <dt className="text-xs text-ink-soft font-medium">Pickup Mode</dt>
                <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 capitalize">
                  {booking.pickup?.mode === "fixed" ? "Fixed Counter (Agent)" : "Flexible Area (Individual)"}
                </dd>
              </div>

              <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                <dt className="text-xs text-ink-soft font-medium">Address & Landmark</dt>
                <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                  <p>{booking.pickup?.address || "Address not provided"}</p>
                  {booking.pickup?.landmark && (
                    <p className="text-xs text-ink-soft mt-0.5">Landmark: {booking.pickup.landmark}</p>
                  )}
                </dd>
              </div>

              {booking.pickup?.finalizedAt && (
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Point Finalized At</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {formatDateTime(booking.pickup.finalizedAt)}
                  </dd>
                </div>
              )}
            </DefinitionList>

            {booking.pickup?.location?.coordinates && (
              <OsmMap
                latitude={booking.pickup.location.coordinates[1]}
                longitude={booking.pickup.location.coordinates[0]}
                label="Booking Pickup Location"
              />
            )}
          </div>
        </section>

        {/* 5. Vehicle Confirmation */}
        <section className="bg-surface border border-line rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
              5. Vehicle Confirmation
            </h2>
            <Badge tone={booking.vehicleConfirmation?.confirmedAt ? "brand" : "warning"}>
              {booking.vehicleConfirmation?.confirmedAt ? "Confirmed by Owner" : "Confirmation Pending"}
            </Badge>
          </div>

          <DefinitionList className="mt-3">
            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Confirmation Due</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                {formatDateTime(booking.vehicleConfirmation?.dueAt)}
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Confirmed At</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                {booking.vehicleConfirmation?.confirmedAt
                  ? formatDateTime(booking.vehicleConfirmation.confirmedAt)
                  : "Not yet confirmed"}
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Confirmed Numbers</dt>
              <dd className="mt-1 text-sm font-mono text-ink sm:col-span-2 sm:mt-0">
                Reg: {booking.vehicleConfirmation?.registrationNumber || "None"} &bull; Chassis:{" "}
                {booking.vehicleConfirmation?.chassisNumber || "None"}
              </dd>
            </div>

            {booking.vehicleConfirmation?.missedAt && (
              <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline bg-[#FDF0EF] p-2.5 rounded">
                <dt className="text-xs text-negative font-semibold">Confirmation Missed</dt>
                <dd className="mt-1 text-xs text-negative sm:col-span-2 sm:mt-0 font-medium">
                  Owner missed the 24-hour pre-journey confirmation window at{" "}
                  {formatDateTime(booking.vehicleConfirmation.missedAt)}.
                </dd>
              </div>
            )}
          </DefinitionList>
        </section>

        {/* 6. Handover */}
        <section className="bg-surface border border-line rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
              6. Handover Record
            </h2>
            <Badge tone={booking.handover?.pickedUpAt ? "brand" : "neutral"}>
              {booking.handover?.pickedUpAt ? "Vehicle Handed Over" : "Not Picked Up"}
            </Badge>
          </div>

          <DefinitionList className="mt-3">
            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Credentials Checked</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 space-y-1">
                <p>
                  Government ID:{" "}
                  <strong>{booking.handover?.customerIdVerified ? "Verified" : "Not Verified"}</strong>
                </p>
                <p>
                  Driving License:{" "}
                  <strong>{booking.handover?.licenseVerified ? "Verified" : "Not Verified"}</strong>
                </p>
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Handover Verified At</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                {formatDateTime(booking.handover?.verifiedAt)}
              </dd>
            </div>

            {booking.handover?.declined?.at && (
              <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline bg-[#FDF0EF] p-3 rounded">
                <dt className="text-xs text-negative font-semibold">Handover Declined</dt>
                <dd className="mt-1 text-xs text-negative sm:col-span-2 sm:mt-0 space-y-0.5">
                  <p>Reason: {booking.handover.declined.reason}</p>
                  <p>Note: {booking.handover.declined.note}</p>
                  <p className="text-ink-soft">At: {formatDateTime(booking.handover.declined.at)}</p>
                </dd>
              </div>
            )}
          </DefinitionList>
        </section>

        {/* 7. Unavailability and Cancellation */}
        {(booking.unavailability?.reportedAt || booking.cancellation?.at) && (
          <section className="bg-surface border border-line rounded p-5">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
              7. Unavailability & Cancellation
            </h2>

            <DefinitionList className="mt-3">
              {booking.unavailability?.reportedAt && (
                <>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Unavailability Reason</dt>
                    <dd className="mt-1 text-sm font-semibold text-negative sm:col-span-2 sm:mt-0">
                      {booking.unavailability.reason}
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Disclosure Lead Time</dt>
                    <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                      Reported {booking.unavailability.hoursBeforePickup}h before pickup (
                      {booking.unavailability.lateDisclosure ? "Late disclosure" : "On time"})
                    </dd>
                  </div>
                </>
              )}

              {booking.cancellation?.at && (
                <>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Cancelled At</dt>
                    <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                      {formatDateTime(booking.cancellation.at)}
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Cancellation Reason</dt>
                    <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                      {booking.cancellation.reason || "None recorded"}
                    </dd>
                  </div>
                </>
              )}
            </DefinitionList>
          </section>
        )}

        {/* 8. Date Change Requests */}
        {booking.modificationRequests && booking.modificationRequests.length > 0 && (
          <section className="bg-surface border border-line rounded p-5">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
              8. Date Change Requests ({booking.modificationRequests.length})
            </h2>

            <div className="divide-y divide-line mt-3">
              {booking.modificationRequests.map((mod, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-ink">
                      New Dates: {formatDateTime(mod.newStartAt)} to {formatDateTime(mod.newEndAt)}
                    </p>
                    <p className="text-ink-soft">Requested on {formatDateTime(mod.createdAt)}</p>
                  </div>
                  <Badge
                    tone={
                      mod.status === "accepted"
                        ? "brand"
                        : mod.status === "rejected"
                        ? "negative"
                        : "warning"
                    }
                  >
                    {mod.status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. Issues & Reviews */}
        <section className="bg-surface border border-line rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
              9. Issues & Reviews
            </h2>
            <div className="flex items-center gap-2">
              {booking.hasOpenIssue ? (
                <Badge tone="negative">Open Issue Active</Badge>
              ) : (
                <Badge tone="neutral">No Open Issues</Badge>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-ink-soft">
            <Link
              href={`/issues?search=${booking.bookingCode}`}
              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
            >
              <span>View issues filed for this booking code</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* 10. Status History */}
        <section className="bg-surface border border-line rounded p-5">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
            10. Timeline & Status History ({historyList.length})
          </h2>

          <div className="divide-y divide-line mt-3">
            {historyList.map((item, idx) => {
              const meta = getBookingStatusMeta(item.status);
              return (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink-soft w-6 shrink-0">{idx + 1}.</span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {item.note && <span className="text-ink font-medium">{item.note}</span>}
                  </div>
                  <span className="text-ink-soft font-mono pl-8 sm:pl-0">
                    {formatDateTime(item.at)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sticky Action Bar */}
        <StickyActionBar
          info={
            <span>
              Booking: <strong>{booking.bookingCode}</strong> ({statusMeta.label})
            </span>
          }
        >
          <Button variant="danger" onClick={handleOpenOverride}>
            Change status
          </Button>
        </StickyActionBar>

        {/* Status Override Dialog */}
        <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
          <DialogContent title="Override Booking Status" className="max-w-md">
            <form onSubmit={handleConfirmOverride} className="space-y-4">
              <div className="bg-[#FEF6E9] border border-warning/30 rounded p-3 text-xs text-ink flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span>
                  Use this only to fix a booking that is stuck or wrong. It changes what the customer and the
                  owner see, and it is recorded in the audit log with your note.
                </span>
              </div>

              {overrideError && (
                <div className="bg-[#FDF0EF] border border-negative/30 rounded p-3 text-xs text-negative">
                  {overrideError}
                </div>
              )}

              <div className="bg-paper p-3 rounded border border-line text-xs">
                <span className="text-ink-soft">Current Status:</span>{" "}
                <strong>{statusMeta.label}</strong>
              </div>

              <Field label="Target Status" required>
                <Select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  options={OVERRIDE_STATUS_OPTIONS}
                />
              </Field>

              <Field
                label="Required Audit Note"
                required
                hint="Minimum 10 characters explaining why this manual override is executed."
              >
                <Textarea
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Correcting stuck status due to phone confirmation mismatch..."
                  rows={4}
                  required
                />
              </Field>

              <p className="text-xs text-ink-soft italic">
                This action is recorded in the audit log.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => setOverrideDialogOpen(false)}
                  disabled={overrideMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  isLoading={overrideMutation.isPending}
                  disabled={overrideNote.trim().length < 10}
                >
                  Confirm Override
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
