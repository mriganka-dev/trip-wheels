"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  addHours,
  differenceInHours,
  differenceInSeconds,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { AcceptBookingDialog } from "@/components/bookings/accept-booking-dialog";
import { RejectBookingDialog } from "@/components/bookings/reject-booking-dialog";
import { useAuth } from "@/hooks/use-auth";
import { getReceivedBookings } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query-keys";
import { getBookingStatusMeta } from "@/lib/constants";
import type { Booking } from "@/types/booking";

interface ActionItem {
  id: string;
  type:
    | "request"
    | "confirmation_due"
    | "pickup_ready_due"
    | "date_change"
    | "overdue"
    | "open_issue";
  booking: Booking;
  title: string;
  vehicleTitle: string;
  bookingCode: string;
  deadline?: string;
  urgency: number; // lower number = more urgent
  actionLabel: string;
  actionHref?: string;
  isDirectRequestAction?: boolean;
}

export default function HomePage() {
  const { user, profile, verificationStatus } = useAuth();

  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    document.title = "Today | Trip Wheels Partner";
  }, []);

  // Fetch received bookings, refetching every 60 seconds and on window focus
  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    isError: isErrorBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: queryKeys.bookings.received({ limit: 100 }),
    queryFn: () => getReceivedBookings({ limit: 100 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const allBookings: Booking[] = useMemo(
    () => bookingsData?.items || [],
    [bookingsData?.items]
  );

  // Build "Needs your action" list ordered by urgency
  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];
    const now = new Date();

    allBookings.forEach((b) => {
      const vTitle = `${b.vehicle.brand} ${b.vehicle.model}`;

      // 1. Overdue returns (Urgency 1)
      const isPastEnd = b.status === "ongoing" && parseISO(b.endAt) < now;
      if (b.isOverdue || isPastEnd) {
        items.push({
          id: `overdue-${b._id}`,
          type: "overdue",
          booking: b,
          title: "Return is overdue",
          vehicleTitle: vTitle,
          bookingCode: b.bookingCode,
          urgency: 1,
          actionLabel: "View trip",
          actionHref: `/bookings/${b._id}`,
        });
      }

      // 2. New requests waiting for a reply (Urgency 2)
      if (b.status === "requested" && b.responseDeadlineAt) {
        const isExpired = differenceInSeconds(parseISO(b.responseDeadlineAt), now) <= 0;
        if (!isExpired) {
          items.push({
            id: `request-${b._id}`,
            type: "request",
            booking: b,
            title: "New request waiting for reply",
            vehicleTitle: vTitle,
            bookingCode: b.bookingCode,
            deadline: b.responseDeadlineAt,
            urgency: 2,
            actionLabel: "Reply",
            isDirectRequestAction: true,
          });
        }
      }

      // 3. Vehicle confirmations due (Urgency 3)
      if (b.status === "confirmed" && !b.vehicleConfirmation?.confirmedAt) {
        const hoursToPickup = differenceInHours(parseISO(b.startAt), now);
        const dueAtPassed =
          b.vehicleConfirmation?.dueAt &&
          parseISO(b.vehicleConfirmation.dueAt) <= addHours(now, 12);
        const within24Hours = hoursToPickup <= 24 && hoursToPickup >= 0;

        if (dueAtPassed || within24Hours) {
          items.push({
            id: `confirm-${b._id}`,
            type: "confirmation_due",
            booking: b,
            title: "Vehicle confirmation due (24h lead time)",
            vehicleTitle: vTitle,
            bookingCode: b.bookingCode,
            urgency: 3,
            actionLabel: "Confirm vehicle",
            actionHref: `/bookings/${b._id}`,
          });
        }
      }

      // 4. Pickups within 3 hours not marked ready (Urgency 4)
      if (b.status === "confirmed" && !b.prePickupConfirmedAt) {
        const hoursToPickup = differenceInHours(parseISO(b.startAt), now);
        if (hoursToPickup >= 0 && hoursToPickup <= 3) {
          items.push({
            id: `ready-${b._id}`,
            type: "pickup_ready_due",
            booking: b,
            title: "Pickup within 3 hours (mark vehicle ready)",
            vehicleTitle: vTitle,
            bookingCode: b.bookingCode,
            urgency: 4,
            actionLabel: "Confirm ready",
            actionHref: `/bookings/${b._id}`,
          });
        }
      }

      // 5. Customer date change requests (Urgency 5)
      const hasPendingMod = b.modificationRequests?.some(
        (m) => m.status === "pending"
      );
      if (hasPendingMod) {
        items.push({
          id: `mod-${b._id}`,
          type: "date_change",
          booking: b,
          title: "Date modification requested by customer",
          vehicleTitle: vTitle,
          bookingCode: b.bookingCode,
          urgency: 5,
          actionLabel: "Review change",
          actionHref: `/bookings/${b._id}`,
        });
      }

      // 6. Open issues needing response (Urgency 6)
      if (b.hasOpenIssue) {
        items.push({
          id: `issue-${b._id}`,
          type: "open_issue",
          booking: b,
          title: "Open issue needs your response",
          vehicleTitle: vTitle,
          bookingCode: b.bookingCode,
          urgency: 6,
          actionLabel: "View issue",
          actionHref: `/bookings/${b._id}`,
        });
      }
    });

    // Sort by urgency first, then by deadline if requests
    return items.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency - b.urgency;
      }
      if (a.deadline && b.deadline) {
        return (
          parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime()
        );
      }
      return 0;
    });
  }, [allBookings]);

  // Today schedule: pickups and returns for today
  const todaySchedule = useMemo(() => {
    const today = startOfDay(new Date());

    const pickups = allBookings.filter((b) => {
      const isTodayStart = isSameDay(parseISO(b.startAt), today);
      const isRelevant =
        b.status === "confirmed" ||
        b.status === "ongoing" ||
        b.status === "requested";
      return isTodayStart && isRelevant;
    });

    const returns = allBookings.filter((b) => {
      const isTodayEnd = isSameDay(parseISO(b.endAt), today);
      const isRelevant =
        b.status === "ongoing" ||
        b.status === "confirmed" ||
        b.status === "completed";
      return isTodayEnd && isRelevant;
    });

    return { pickups, returns };
  }, [allBookings]);

  const reliabilityScore = profile?.reliability?.score ?? 100;
  const isApproved = verificationStatus === "approved";
  const hasNotificationsSetup = Boolean(profile?.notificationsTestConfirmedAt);

  return (
    <AppShell
      title="Today"
      subtitle="Overview of your rental operations, requests and handovers."
    >
      <div className="flex flex-col gap-6">
        {/* 1. Verification Banner (when not approved) */}
        {!isApproved && (
          <div
            role="alert"
            className="p-4 rounded-md border border-amber-300 bg-amber-50 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">
                  {verificationStatus === "not_submitted" &&
                    "Your partner account is not submitted for verification."}
                  {verificationStatus === "pending" &&
                    "Your partner verification is currently in review."}
                  {verificationStatus === "rejected" &&
                    "Your partner verification was not approved."}
                  {verificationStatus === "reverification_required" &&
                    "New verification documents are needed."}
                  {verificationStatus === "suspended" &&
                    "Your partner account is currently suspended."}
                </p>
                <p className="text-amber-800 mt-0.5">
                  {verificationStatus === "not_submitted" &&
                    "Complete your business profile and upload required documents to start receiving customer requests."}
                  {verificationStatus === "pending" &&
                    "Our team is reviewing your documents and will call you on your registered phone number."}
                  {verificationStatus === "rejected" &&
                    "Review the remarks from the admin team and update your documents to resubmit."}
                  {verificationStatus === "reverification_required" &&
                    "Please upload updated identification or business documents."}
                  {verificationStatus === "suspended" &&
                    "Contact partner support to resolve this account suspension."}
                </p>
              </div>
            </div>

            <Link href="/verification" className="shrink-0">
              <Button variant="secondary" size="sm" className="text-xs">
                Go to verification
              </Button>
            </Link>
          </div>
        )}

        {/* Error fetching bookings */}
        {isErrorBookings && (
          <div
            role="alert"
            className="p-4 rounded-md border border-(--negative) bg-(--negative)/10 text-xs text-(--negative) flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to load booking operations.</p>
                <p className="text-(--ink-soft) mt-0.5">
                  Check your network connection and retry.
                </p>
              </div>
            </div>
            <Button variant="quiet" size="sm" onClick={() => refetchBookings()}>
              Retry
            </Button>
          </div>
        )}

        {/* 2. Needs Your Action (ordered by urgency) */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 flex flex-col gap-3">
          <div className="border-b border-(--line) pb-2 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-(--ink)">
                Needs your action
              </h2>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                Urgent requests, vehicle confirmations and active trip operations.
              </p>
            </div>

            {actionItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-(--brand) text-white">
                {actionItems.length}
              </span>
            )}
          </div>

          {isLoadingBookings && (
            <div className="space-y-2 py-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!isLoadingBookings && actionItems.length === 0 && (
            <p className="text-xs text-(--ink-soft) py-3">
              Nothing needs your action right now.
            </p>
          )}

          {!isLoadingBookings && actionItems.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    "p-3 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors",
                    item.urgency <= 2
                      ? "border-amber-300 bg-amber-50/70"
                      : "border-(--line) bg-(--paper)"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded bg-(--surface) text-(--brand) shrink-0 mt-0.5">
                      {item.type === "request" && <Clock className="w-4 h-4 text-amber-700" />}
                      {item.type === "confirmation_due" && (
                        <ShieldAlert className="w-4 h-4 text-(--brand)" />
                      )}
                      {item.type === "pickup_ready_due" && (
                        <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                      )}
                      {item.type === "overdue" && (
                        <AlertCircle className="w-4 h-4 text-(--negative)" />
                      )}
                      {item.type === "date_change" && (
                        <Calendar className="w-4 h-4 text-(--brand)" />
                      )}
                      {item.type === "open_issue" && (
                        <AlertTriangle className="w-4 h-4 text-(--negative)" />
                      )}
                    </span>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-(--ink)">
                          {item.title}
                        </span>
                        <Link
                          href={`/bookings/${item.booking._id}`}
                          className="font-mono text-xs font-bold text-(--brand) hover:underline"
                        >
                          {item.bookingCode}
                        </Link>
                      </div>

                      <p className="text-[11px] text-(--ink-soft)">
                        Vehicle:{" "}
                        <strong className="text-(--ink)">
                          {item.vehicleTitle}
                        </strong>{" "}
                        • Customer: {item.booking.customer?.fullName || "Customer"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center ml-auto sm:ml-0">
                    {item.deadline && (
                      <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <Countdown deadline={item.deadline} />
                      </span>
                    )}

                    {item.isDirectRequestAction ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActionBooking(item.booking);
                            setIsRejectOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setActionBooking(item.booking);
                            setIsAcceptOpen(true);
                          }}
                        >
                          Accept
                        </Button>
                      </div>
                    ) : item.actionHref ? (
                      <Link href={item.actionHref}>
                        <Button variant="secondary" size="sm">
                          {item.actionLabel}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Today: Pickups and Returns */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-4 sm:p-5 flex flex-col gap-3">
          <div className="border-b border-(--line) pb-2 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-(--ink)">
                Today
              </h2>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                Pickups and returns scheduled for today ({format(new Date(), "d MMMM yyyy")}).
              </p>
            </div>

            <Link href="/schedule">
              <Button variant="quiet" size="sm" className="text-xs">
                Full 14-day schedule
              </Button>
            </Link>
          </div>

          {isLoadingBookings && (
            <div className="space-y-2 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {!isLoadingBookings &&
            todaySchedule.pickups.length === 0 &&
            todaySchedule.returns.length === 0 && (
              <p className="text-xs text-(--ink-soft) py-3">
                No vehicle pickups or returns scheduled for today.
              </p>
            )}

          {!isLoadingBookings &&
            (todaySchedule.pickups.length > 0 ||
              todaySchedule.returns.length > 0) && (
              <div className="flex flex-col gap-2">
                {/* Pickups today */}
                {todaySchedule.pickups.map((b) => {
                  const meta = getBookingStatusMeta(b.status);
                  return (
                    <div
                      key={`today-pickup-${b._id}`}
                      className="p-3 rounded border border-(--line) bg-(--paper) flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-(--brand-tint) text-(--brand)">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </span>
                        <Badge tone="brand">Pickup</Badge>
                        <span className="font-semibold text-(--ink)">
                          {format(parseISO(b.startAt), "h:mm a")}
                        </span>
                        <Link
                          href={`/bookings/${b._id}`}
                          className="font-mono font-bold text-(--brand) hover:underline"
                        >
                          {b.bookingCode}
                        </Link>
                        <span className="text-(--ink-soft)">
                          • {b.vehicle.brand} {b.vehicle.model} ({b.customer?.fullName || "Customer"})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Link href={`/bookings/${b._id}`}>
                          <Button variant="quiet" size="sm" className="text-xs">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Returns today */}
                {todaySchedule.returns.map((b) => {
                  const meta = getBookingStatusMeta(b.status);
                  return (
                    <div
                      key={`today-return-${b._id}`}
                      className="p-3 rounded border border-(--line) bg-(--paper) flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-amber-50 text-(--warning)">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                        <Badge tone="warning">Return</Badge>
                        <span className="font-semibold text-(--ink)">
                          {format(parseISO(b.endAt), "h:mm a")}
                        </span>
                        <Link
                          href={`/bookings/${b._id}`}
                          className="font-mono font-bold text-(--brand) hover:underline"
                        >
                          {b.bookingCode}
                        </Link>
                        <span className="text-(--ink-soft)">
                          • {b.vehicle.brand} {b.vehicle.model} ({b.customer?.fullName || "Customer"})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Link href={`/bookings/${b._id}`}>
                          <Button variant="quiet" size="sm" className="text-xs">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </section>

        {/* 4. Your Standing (Reliability Score single plain line) */}
        <div className="p-4 rounded-md border border-(--line) bg-(--surface) flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-(--brand) shrink-0" />
            <p className="text-(--ink)">
              Your reliability score is{" "}
              <strong className="font-bold text-(--brand)">
                {reliabilityScore}
              </strong>
              .{" "}
              <Link
                href="/reliability"
                className="text-(--brand) underline hover:text-(--brand-dark) font-medium"
              >
                See what affects it.
              </Link>
            </p>
          </div>
        </div>

        {/* 5. Push Notifications Status Line */}
        {!hasNotificationsSetup && (
          <div className="p-3.5 rounded-md border border-(--line) bg-(--paper) flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-(--brand) shrink-0" />
              <p className="text-(--ink-soft)">
                Turn on push alerts to get immediate notifications for new
                requests on your phone.{" "}
                <Link
                  href="/notifications"
                  className="text-(--brand) underline hover:text-(--brand-dark) font-medium"
                >
                  Set up notifications
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Accept and Reject Dialogs */}
        <AcceptBookingDialog
          booking={actionBooking}
          isOpen={isAcceptOpen}
          onClose={() => {
            setIsAcceptOpen(false);
            setActionBooking(null);
          }}
          userRole={user?.role}
        />

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
