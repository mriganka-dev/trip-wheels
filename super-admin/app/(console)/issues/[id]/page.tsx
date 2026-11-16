"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { DefinitionList } from "@/components/ui/definition-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { ImageViewer } from "@/components/ui/image-viewer";
import { RadioGroup } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/use-page-title";
import { getBookingById } from "@/lib/api/bookings";
import { getIssueById, resolveAdminIssue } from "@/lib/api/issues";
import {
  getBookingStatusMeta,
  getIssueStatusMeta,
  getIssueTypeLabel,
  getSeverityMeta,
} from "@/lib/constants";
import { formatDateTime, formatPhone, formatWaitingFor } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { IssueResolutionOutcome, ResolveAdminIssuePayload } from "@/types/issues";

export default function IssueReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const issueId = params?.id as string;

  // Dialog states
  const [underReviewDialogOpen, setUnderReviewDialogOpen] = useState<boolean>(false);
  const [underReviewNote, setUnderReviewNote] = useState<string>("");

  const [dismissDialogOpen, setDismissDialogOpen] = useState<boolean>(false);

  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState<boolean>(false);

  // Resolve form state
  const [outcome, setOutcome] = useState<IssueResolutionOutcome>("upheld");
  const [adminNote, setAdminNote] = useState<string>("");
  const [applyPenalty, setApplyPenalty] = useState<boolean>(true);
  const [suspendPublisher, setSuspendPublisher] = useState<boolean>(false);
  const [suspendVehicle, setSuspendVehicle] = useState<boolean>(false);
  const [suspendCustomer, setSuspendCustomer] = useState<boolean>(false);
  const [resolveFormError, setResolveFormError] = useState<string | null>(null);

  // Selected evidence index
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState<number>(0);

  // Fetch issue detail
  const issueQuery = useQuery({
    queryKey: queryKeys.issues.detail(issueId),
    queryFn: () => getIssueById(issueId),
    enabled: Boolean(issueId),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const issue = issueQuery.data;
  usePageTitle(issue ? `Issue: ${getIssueTypeLabel(issue.type)}` : "Issue Review");

  // Fetch complete booking details if issue has booking
  const bookingId = issue?.booking?._id;
  const bookingQuery = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId || ""),
    queryFn: () => getBookingById(bookingId || ""),
    enabled: Boolean(bookingId),
    refetchInterval: 60000,
  });

  const fullBooking = bookingQuery.data;

  // Mutation for resolving/dismissing/under review
  const actionMutation = useMutation({
    mutationFn: (payload: ResolveAdminIssuePayload) => resolveAdminIssue(issueId, payload),
    onSuccess: (updatedIssue, payload) => {
      const isResolved = payload.status === "resolved" || (!payload.status && payload.outcome !== "dismissed");
      const msg =
        payload.status === "under_review"
          ? "Issue marked as under review"
          : isResolved
          ? "Issue resolved successfully"
          : "Issue dismissed";

      showToast(msg, "brand");
      setResolveModalOpen(false);
      setResolveConfirmOpen(false);
      setUnderReviewDialogOpen(false);
      setDismissDialogOpen(false);

      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      }
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to update issue", "negative");
    },
  });

  // Action handlers
  const handleMoveToUnderReview = () => {
    actionMutation.mutate({
      outcome: "partially_upheld",
      status: "under_review",
      adminNote: underReviewNote.trim() || "Status changed to under review by admin.",
    });
  };

  const handleDismissConfirm = (reason: string) => {
    actionMutation.mutate({
      outcome: "dismissed",
      status: "dismissed",
      adminNote: reason.trim(),
    });
  };

  const handleOpenResolveModal = () => {
    setOutcome("upheld");
    setAdminNote("");
    setApplyPenalty(true);
    setSuspendPublisher(false);
    setSuspendVehicle(false);
    setSuspendCustomer(false);
    setResolveFormError(null);
    setResolveModalOpen(true);
  };

  const handleProceedToResolveConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNote.trim()) {
      setResolveFormError("A written note explaining the resolution is required.");
      return;
    }
    setResolveFormError(null);
    setResolveConfirmOpen(true);
  };

  const handleExecuteResolution = () => {
    actionMutation.mutate({
      outcome,
      status: "resolved",
      adminNote: adminNote.trim(),
      penaltyApplied: applyPenalty,
      suspendPublisher,
      suspendVehicle,
      suspendCustomer,
    });
  };

  if (issueQuery.isLoading) {
    return (
      <AppShell title="Issue Review">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (issueQuery.isError || !issue) {
    return (
      <AppShell title="Issue Not Found">
        <EmptyState
          title="Issue Not Found"
          description={issueQuery.error?.message || "The requested issue does not exist or access is restricted."}
          action={
            <Button variant="secondary" onClick={() => router.push("/issues")}>
              Back to Issues
            </Button>
          }
        />
      </AppShell>
    );
  }

  // Pre-conditions for rule: "Never decide on the page alone: the booking context and both parties' histories must be visible before the Resolve button is enabled, which means the page must have finished loading them."
  const isDataFullyLoaded = !issueQuery.isLoading && (!bookingId || !bookingQuery.isLoading);
  const isOpenOrUnderReview = issue.status === "open" || issue.status === "under_review";
  const statusMeta = getIssueStatusMeta(issue.status);
  const severityMeta = getSeverityMeta(issue.severity);

  // Evidence list
  const evidenceList = issue.evidence || [];
  const currentEvidence = evidenceList[activeEvidenceIndex];

  // History counts for both parties
  const raisedByHistory = issue.raisedBy?.reliability;
  const raisedAgainstHistory = issue.raisedAgainst?.reliability;

  // Determine who is publisher vs customer
  const isAgainstPublisher =
    fullBooking?.publisher?._id === issue.raisedAgainst?._id ||
    issue.raisedAgainst?.role === "agent" ||
    issue.raisedAgainst?.role === "individual";

  return (
    <AppShell
      title={`Issue: ${getIssueTypeLabel(issue.type)}`}
      contextLine={`Status: ${statusMeta.label} | Severity: ${severityMeta.label} | Booking: ${
        issue.booking?.bookingCode || "N/A"
      }`}
    >
      <div className="space-y-6 pb-20">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <Link
            href="/issues"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Issues
          </Link>
          <div className="flex items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <Badge tone={severityMeta.tone}>{severityMeta.label}</Badge>
          </div>
        </div>

        {/* Closed or Resolved Banner */}
        {!isOpenOrUnderReview && (
          <div className="bg-paper border border-line p-4 rounded text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>
                Issue closed with status: {statusMeta.label} ({issue.resolution?.outcome || "completed"})
              </span>
            </div>
            {issue.resolution?.adminNote && (
              <p className="text-ink-soft pl-6">
                <strong>Admin note:</strong> {issue.resolution.adminNote}
              </p>
            )}
            {issue.resolution?.resolvedAt && (
              <p className="text-ink-soft pl-6">
                Closed at {formatDateTime(issue.resolution.resolvedAt)}
              </p>
            )}
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* 1. The Issue */}
            <section className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                1. The Issue
              </h2>
              <DefinitionList className="mt-3">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Issue Type</dt>
                  <dd className="mt-1 text-sm font-bold text-ink sm:col-span-2 sm:mt-0">
                    {getIssueTypeLabel(issue.type)}
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Severity</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                    <Badge tone={severityMeta.tone}>{severityMeta.label}</Badge>
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Raised By</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    <p className="font-semibold">{issue.raisedBy?.fullName || "User"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {issue.raisedBy?.phone && (
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`tel:${issue.raisedBy.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-brand font-mono hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {formatPhone(issue.raisedBy.phone)}
                          </a>
                          <CopyButton value={issue.raisedBy.phone} label="Copy phone" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft">{issue.raisedBy?.email}</p>
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Raised Against</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    <p className="font-semibold">{issue.raisedAgainst?.fullName || "User"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {issue.raisedAgainst?.phone && (
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`tel:${issue.raisedAgainst.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-brand font-mono hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {formatPhone(issue.raisedAgainst.phone)}
                          </a>
                          <CopyButton value={issue.raisedAgainst.phone} label="Copy phone" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft">{issue.raisedAgainst?.email}</p>
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Submitted At</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {formatDateTime(issue.createdAt)}
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Description</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 whitespace-pre-wrap bg-paper/50 p-3 rounded border border-line">
                    {issue.description}
                  </dd>
                </div>
              </DefinitionList>
            </section>

            {/* 2. The Other Side */}
            <section className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                2. The Other Side (Response)
              </h2>
              {issue.response?.text ? (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="font-semibold text-ink">
                      Response from {issue.raisedAgainst?.fullName || "Respondent"}:
                    </span>
                    <span>
                      {issue.response.at ? formatDateTime(issue.response.at) : "Submitted"}
                    </span>
                  </div>
                  <div className="p-3 bg-paper/50 rounded border border-line text-sm text-ink whitespace-pre-wrap">
                    {issue.response.text}
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-4 bg-paper/30 border border-line rounded text-xs space-y-1">
                  <div className="flex items-center gap-2 text-warning font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>No response submitted yet</span>
                  </div>
                  <p className="text-ink-soft">
                    Respondent has been waiting to reply for {formatWaitingFor(issue.createdAt)}.
                  </p>
                </div>
              )}
            </section>

            {/* 3. Booking Context */}
            <section className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  3. Booking Context
                </h2>
                {issue.booking?._id && (
                  <Link
                    href={`/bookings/${issue.booking._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <span>Full booking page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {fullBooking ? (
                <DefinitionList className="mt-3">
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Booking Code</dt>
                    <dd className="mt-1 text-sm font-mono font-bold text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <span>{fullBooking.bookingCode}</span>
                      <CopyButton value={fullBooking.bookingCode} label="Copy code" />
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Booking Status</dt>
                    <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                      <Badge tone={getBookingStatusMeta(fullBooking.status).tone}>
                        {getBookingStatusMeta(fullBooking.status).label}
                      </Badge>
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Dates & Duration</dt>
                    <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0 space-y-0.5">
                      <p>Start: {formatDateTime(fullBooking.startAt)}</p>
                      <p>End: {formatDateTime(fullBooking.endAt)}</p>
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Booked vs Assigned</dt>
                    <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0 space-y-1">
                      <p>
                        Booked: {fullBooking.vehicle?.brand} {fullBooking.vehicle?.model} (Reg:{" "}
                        {fullBooking.vehicle?.registrationNumber || "N/A"})
                      </p>
                      {fullBooking.assignedVehicle &&
                        fullBooking.vehicle &&
                        fullBooking.assignedVehicle._id !== fullBooking.vehicle._id && (
                          <p className="text-warning font-semibold">
                            Assigned Alternative: {fullBooking.assignedVehicle.brand}{" "}
                            {fullBooking.assignedVehicle.model} (Reg:{" "}
                            {fullBooking.assignedVehicle.registrationNumber || "N/A"})
                          </p>
                        )}
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Vehicle Confirmation</dt>
                    <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0">
                      {fullBooking.vehicleConfirmation?.confirmedAt ? (
                        <p className="text-brand font-semibold">
                          Confirmed on time: {formatDateTime(fullBooking.vehicleConfirmation.confirmedAt)}{" "}
                          (Reg: {fullBooking.vehicleConfirmation.registrationNumber || "N/A"}, Chassis:{" "}
                          {fullBooking.vehicleConfirmation.chassisNumber || "N/A"})
                        </p>
                      ) : fullBooking.vehicleConfirmation?.missedAt ? (
                        <p className="text-negative font-semibold">
                          Vehicle confirmation was missed at scheduled deadline
                        </p>
                      ) : (
                        <p className="text-ink-soft">
                          Due by {formatDateTime(fullBooking.vehicleConfirmation?.dueAt)}
                        </p>
                      )}
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Unavailability</dt>
                    <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0">
                      {fullBooking.unavailability?.reportedAt ? (
                        <div className="space-y-0.5">
                          <p className="text-negative font-semibold">
                            Disclosed: {fullBooking.unavailability.reason || "Unavailability reported"}
                          </p>
                          <p className="text-ink-soft">
                            Reported at {formatDateTime(fullBooking.unavailability.reportedAt)}
                            {fullBooking.unavailability.lateDisclosure && " (Late disclosure)"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-ink-soft">No unavailability disclosed</p>
                      )}
                    </dd>
                  </div>
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Handover Record</dt>
                    <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0">
                      {fullBooking.handover?.pickedUpAt ? (
                        <p className="text-brand font-semibold">
                          Vehicle picked up: {formatDateTime(fullBooking.handover.pickedUpAt)} (ID check:{" "}
                          {fullBooking.handover.customerIdVerified ? "Passed" : "Not checked"}, License:{" "}
                          {fullBooking.handover.licenseVerified ? "Passed" : "Not checked"})
                        </p>
                      ) : fullBooking.handover?.declined?.at ? (
                        <p className="text-negative font-semibold">
                          Handover declined: {fullBooking.handover.declined.reason || "Declined at pickup"}
                        </p>
                      ) : (
                        <p className="text-ink-soft">Handover not yet initiated or recorded</p>
                      )}
                    </dd>
                  </div>
                </DefinitionList>
              ) : (
                <div className="mt-3 p-4 bg-paper/30 border border-line rounded text-xs text-ink-soft">
                  {issue.booking ? (
                    <p>
                      Booking Code: <strong>{issue.booking.bookingCode}</strong> (Status:{" "}
                      {issue.booking.status})
                    </p>
                  ) : (
                    <p>No booking is linked to this issue.</p>
                  )}
                </div>
              )}
            </section>

            {/* 4. History of Both Parties */}
            <section className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                4. History & Reliability of Both Parties
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                {/* Raised By Party */}
                <div className="p-3 bg-paper/40 border border-line rounded space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-line">
                    <span className="font-bold text-ink">Raised by: {issue.raisedBy?.fullName}</span>
                    <span className="font-semibold text-brand">
                      Score: {raisedByHistory?.score ?? 100}/100
                    </span>
                  </div>
                  <div className="space-y-1 text-ink-soft">
                    <p>
                      Issues upheld against: <strong>{raisedByHistory?.issuesUpheld ?? 0}</strong>
                    </p>
                    <p>
                      Cancellations: <strong>{raisedByHistory?.cancellations ?? 0}</strong>
                    </p>
                    <p>
                      No-shows: <strong>{raisedByHistory?.noShows ?? 0}</strong>
                    </p>
                    <p>
                      Completed trips: <strong>{raisedByHistory?.completedBookings ?? 0}</strong>
                    </p>
                  </div>
                </div>

                {/* Raised Against Party */}
                <div className="p-3 bg-paper/40 border border-line rounded space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-line">
                    <span className="font-bold text-ink">Against: {issue.raisedAgainst?.fullName}</span>
                    <span className="font-semibold text-brand">
                      Score: {raisedAgainstHistory?.score ?? 100}/100
                    </span>
                  </div>
                  <div className="space-y-1 text-ink-soft">
                    <p>
                      Issues upheld against: <strong>{raisedAgainstHistory?.issuesUpheld ?? 0}</strong>
                    </p>
                    <p>
                      Cancellations:{" "}
                      <strong>
                        {raisedAgainstHistory?.cancellations ??
                          raisedAgainstHistory?.cancelledAfterConfirm ??
                          0}
                      </strong>
                    </p>
                    <p>
                      No-shows: <strong>{raisedAgainstHistory?.noShows ?? 0}</strong>
                    </p>
                    {raisedAgainstHistory?.undisclosedUnavailability !== undefined && (
                      <p>
                        Undisclosed unavailability:{" "}
                        <strong>{raisedAgainstHistory.undisclosedUnavailability}</strong>
                      </p>
                    )}
                    {raisedAgainstHistory?.missedConfirmations !== undefined && (
                      <p>
                        Missed vehicle confirmations:{" "}
                        <strong>{raisedAgainstHistory.missedConfirmations}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Timeline */}
            <section className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                5. Issue Timeline ({issue.timeline?.length || 0})
              </h2>
              <div className="divide-y divide-line mt-3">
                {issue.timeline && issue.timeline.length > 0 ? (
                  issue.timeline.map((step, idx) => {
                    const stepBy = typeof step.by === "object" ? step.by?.fullName || "User" : "System/Admin";
                    return (
                      <div key={idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-medium text-ink">{step.note}</p>
                          <p className="text-ink-soft text-[11px]">By: {stepBy}</p>
                        </div>
                        <span className="text-ink-soft font-mono text-[11px] shrink-0">
                          {formatDateTime(step.at)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-ink-soft py-3">No timeline entries recorded.</p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Evidence Viewer */}
          <div className="space-y-4">
            <section className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Evidence Photos ({evidenceList.length})
                </h2>
                {evidenceList.length > 0 && (
                  <span className="text-xs text-ink-soft font-mono">
                    File {activeEvidenceIndex + 1} of {evidenceList.length}
                  </span>
                )}
              </div>

              {evidenceList.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {/* Active photo viewer */}
                  {currentEvidence && (
                    <ImageViewer
                      src={currentEvidence.url}
                      alt={`Evidence file ${activeEvidenceIndex + 1} for issue ${issue._id}`}
                      caption={`Evidence photo ${activeEvidenceIndex + 1} of ${evidenceList.length}`}
                    />
                  )}

                  {/* Thumbnail pagination selector */}
                  {evidenceList.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                      {evidenceList.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveEvidenceIndex(idx)}
                          className={`relative w-16 h-16 rounded border overflow-hidden shrink-0 transition-all ${
                            idx === activeEvidenceIndex
                              ? "border-brand ring-2 ring-brand/20"
                              : "border-line opacity-70 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-surface/90 text-[10px] font-mono px-1">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-ink-soft text-xs space-y-1">
                  <AlertTriangle className="w-6 h-6 mx-auto text-ink-soft mb-1" />
                  <p className="font-semibold text-ink">No evidence attached</p>
                  <p>Neither party uploaded photos when filing or updating this report.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      {isOpenOrUnderReview && (
        <StickyActionBar>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="text-xs text-ink-soft">
              {!isDataFullyLoaded ? (
                <span className="text-warning">
                  Loading booking context and parties history before actions can be taken...
                </span>
              ) : (
                <span>
                  Carefully inspect evidence and historical patterns before deciding on an outcome.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {issue.status === "open" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isDataFullyLoaded || actionMutation.isPending}
                  onClick={() => {
                    setUnderReviewNote("");
                    setUnderReviewDialogOpen(true);
                  }}
                >
                  Move to under review
                </Button>
              )}

              <Button
                type="button"
                variant="quiet"
                size="sm"
                disabled={!isDataFullyLoaded || actionMutation.isPending}
                onClick={() => setDismissDialogOpen(true)}
              >
                Dismiss issue
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!isDataFullyLoaded || actionMutation.isPending}
                onClick={handleOpenResolveModal}
              >
                Resolve issue
              </Button>
            </div>
          </div>
        </StickyActionBar>
      )}

      {/* 1. Move to Under Review Dialog */}
      <Dialog open={underReviewDialogOpen} onOpenChange={setUnderReviewDialogOpen}>
        <DialogContent
          title="Move Issue to Under Review"
          description="Mark this issue as actively under investigation by the admin team."
        >
          <div className="space-y-4 pt-2">
            <Field label="Investigation note (Optional)" hint="Recorded in the issue timeline and audit log">
              <Textarea
                rows={3}
                placeholder="e.g. Contacting owner for proof of repairs..."
                value={underReviewNote}
                onChange={(e) => setUnderReviewNote(e.target.value)}
              />
            </Field>

            <p className="text-xs text-ink-soft">
              This action updates the issue status and records an audit log entry.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setUnderReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={actionMutation.isPending}
                onClick={handleMoveToUnderReview}
              >
                Confirm Move
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Dismiss Confirm Dialog */}
      <ConfirmDialog
        open={dismissDialogOpen}
        onOpenChange={setDismissDialogOpen}
        title="Dismiss Issue"
        description="Dismissing closes this issue without applying penalties or score deductions. A clear written reason is required."
        targetName={`Issue #${issue._id}`}
        actionLabel="Dismiss Issue"
        actionVariant="quiet"
        requireNote={true}
        noteLabel="Dismissal reason"
        notePlaceholder="Explain why this issue is being dismissed..."
        isLoading={actionMutation.isPending}
        onConfirm={handleDismissConfirm}
      />

      {/* 3. Resolve Form Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent
          title="Resolve Issue"
          description="Select the outcome, write an explanatory note visible to both parties, and configure backend follow-ups."
          className="max-w-xl"
        >
          <form onSubmit={handleProceedToResolveConfirm} className="space-y-4 pt-2">
            {resolveFormError && (
              <div className="p-3 bg-[#FEF0ED] border border-negative/20 rounded text-xs text-negative">
                {resolveFormError}
              </div>
            )}

            {/* Outcome Selection */}
            <Field label="Resolution Outcome" required>
              <RadioGroup
                name="resolution-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as IssueResolutionOutcome)}
                options={[
                  {
                    value: "upheld",
                    label: "Upheld (In favor of reporting party)",
                    hint: "The report is validated. The respondent receives a reliability penalty score deduction.",
                  },
                  {
                    value: "partially_upheld",
                    label: "Partially Upheld (Shared responsibility)",
                    hint: "Both parties contributed to the dispute. You can choose whether to apply a penalty.",
                  },
                  {
                    value: "dismissed",
                    label: "Dismissed (Claim rejected)",
                    hint: "The report could not be validated or evidence is insufficient. No penalty is applied.",
                  },
                ]}
              />
            </Field>

            {/* Outcome plain consequence explanation */}
            <div className="p-3 bg-paper border border-line rounded text-xs text-ink space-y-1">
              <p className="font-semibold">Consequence Summary:</p>
              {outcome === "upheld" && (
                <p className="text-negative font-medium">
                  Upheld: The respondent ({issue.raisedAgainst?.fullName}) reliability score is lowered. If you
                  check vehicle or account suspension below, they are removed from customer view.
                </p>
              )}
              {outcome === "partially_upheld" && (
                <p className="text-warning font-medium">
                  Partially Upheld: Both parties receive the explanation. The penalty checkbox below determines
                  whether the score is reduced.
                </p>
              )}
              {outcome === "dismissed" && (
                <p className="text-ink-soft font-medium">
                  Dismissed: No penalty is applied. The issue is recorded as dismissed.
                </p>
              )}
            </div>

            {/* Required Admin Note */}
            <Field
              label="Admin Resolution Note (Required)"
              hint="This note will be recorded into the audit trail and sent to both customer and owner."
              required
            >
              <Textarea
                rows={4}
                required
                placeholder="Detailed rationale for this decision..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </Field>

            {/* Follow-up Options supported by Backend */}
            {outcome !== "dismissed" && (
              <div className="space-y-3 pt-2 border-t border-line">
                <p className="text-xs font-semibold text-ink uppercase tracking-wider font-display">
                  Follow-up Actions
                </p>

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <Checkbox
                      id="opt-penalty"
                      checked={applyPenalty}
                      onChange={(e) => setApplyPenalty(e.target.checked)}
                      label="Apply Reliability Penalty"
                    />
                    <p className="text-[11px] text-ink-soft pl-6">
                      Consequence: Increments issues upheld against respondent and recomputes reliability score.
                    </p>
                  </div>

                  {isAgainstPublisher && (
                    <>
                      <div className="space-y-0.5">
                        <Checkbox
                          id="opt-suspend-pub"
                          checked={suspendPublisher}
                          onChange={(e) => setSuspendPublisher(e.target.checked)}
                          label="Suspend Owner Account"
                        />
                        <p className="text-[11px] text-ink-soft pl-6">
                          Consequence: Immediately sets owner account status to suspended. All their vehicles
                          disappear from public search.
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <Checkbox
                          id="opt-suspend-veh"
                          checked={suspendVehicle}
                          onChange={(e) => setSuspendVehicle(e.target.checked)}
                          label="Suspend Vehicle"
                        />
                        <p className="text-[11px] text-ink-soft pl-6">
                          Consequence: Sets the vehicle status to suspended, hiding it from customer bookings.
                        </p>
                      </div>
                    </>
                  )}

                  {!isAgainstPublisher && (
                    <div className="space-y-0.5">
                      <Checkbox
                        id="opt-suspend-cust"
                        checked={suspendCustomer}
                        onChange={(e) => setSuspendCustomer(e.target.checked)}
                        label="Suspend Customer Account"
                      />
                      <p className="text-[11px] text-ink-soft pl-6">
                        Consequence: Prevents customer from creating future booking requests.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setResolveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Review Decision
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Resolve Final Confirmation Dialog */}
      <Dialog open={resolveConfirmOpen} onOpenChange={setResolveConfirmOpen}>
        <DialogContent
          title="Confirm Resolution Decision"
          description="Review the summary of every choice before saving. This will write an immutable audit log entry."
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3 bg-paper border border-line rounded space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <span className="font-semibold text-ink">Selected Outcome:</span>
                <span className="font-bold text-ink uppercase">{outcome}</span>
              </div>
              <div>
                <span className="font-semibold text-ink block mb-0.5">Admin Note:</span>
                <p className="text-ink-soft whitespace-pre-wrap">{adminNote}</p>
              </div>
              <div className="pt-2 border-t border-line space-y-1">
                <span className="font-semibold text-ink block">Consequences to execute:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-ink-soft">
                  <li>
                    Reliability Penalty:{" "}
                    <strong>{applyPenalty && outcome !== "dismissed" ? "Applied" : "Not applied"}</strong>
                  </li>
                  {isAgainstPublisher && (
                    <>
                      <li>
                        Suspend Owner Account:{" "}
                        <strong>{suspendPublisher && outcome !== "dismissed" ? "Yes" : "No"}</strong>
                      </li>
                      <li>
                        Suspend Vehicle:{" "}
                        <strong>{suspendVehicle && outcome !== "dismissed" ? "Yes" : "No"}</strong>
                      </li>
                    </>
                  )}
                  {!isAgainstPublisher && (
                    <li>
                      Suspend Customer Account:{" "}
                      <strong>{suspendCustomer && outcome !== "dismissed" ? "Yes" : "No"}</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <p className="text-[11px] text-ink-soft">
              This action is recorded in the immutable audit log and notifications will be dispatched to both parties.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setResolveConfirmOpen(false)}
              >
                Back to Edit
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={actionMutation.isPending}
                onClick={handleExecuteResolution}
              >
                Confirm & Save Resolution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
