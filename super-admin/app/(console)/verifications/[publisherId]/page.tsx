"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Phone,
  PhoneCall,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OsmMap } from "@/components/maps/osm-map";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  approveVerification,
  confirmUserPhone,
  getVerificationById,
  recordVerificationCall,
  rejectVerification,
  requestReverification,
  reviewDocument,
  suspendUser,
  unsuspendUser,
} from "@/lib/api/verifications";
import {
  getDocumentStatusMeta,
  getDocumentTypeLabel,
  getVerificationStatusMeta,
} from "@/lib/constants";
import {
  formatDateOnly,
  formatDateTime,
  formatPhone,
  formatWaitingFor,
} from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type {
  VerificationDocumentItem,
} from "@/types/verifications";

export default function PublisherReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const publisherId = params?.publisherId as string;

  // Local checklist state for visual review aid
  const [checklist, setChecklist] = useState({
    nameMatches: false,
    idClearNotExpired: false,
    bizDetailsGenuine: false,
    selfieMatches: false,
  });

  // Selected document for the viewer
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Preference: Return to queue or stay
  const [returnToQueueOnDecision, setReturnToQueueOnDecision] = useState(false);

  // Dialog states
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [phoneConfirmOpen, setPhoneConfirmOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reverifyDialogOpen, setReverifyDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);

  // Single document review dialog state
  const [reviewingDoc, setReviewingDoc] = useState<VerificationDocumentItem | null>(null);
  const [docReviewStatus, setDocReviewStatus] = useState<"approved" | "rejected">("approved");
  const [docRemarks, setDocRemarks] = useState("");

  // Query publisher detail
  const profileQuery = useQuery({
    queryKey: queryKeys.verifications.detail(publisherId),
    queryFn: () => getVerificationById(publisherId),
    enabled: Boolean(publisherId),
  });

  const profile = profileQuery.data;
  usePageTitle(profile ? `Review: ${profile.user?.fullName || "Owner"}` : "Review Owner");

  // Invalidate and optionally redirect
  const handleSuccess = (message: string, isFinalDecision = false) => {
    showToast(message, "brand");
    queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.verifications.detail(publisherId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });

    if (isFinalDecision && returnToQueueOnDecision) {
      router.push("/verifications");
    }
  };

  // Mutations
  const callMutation = useMutation({
    mutationFn: () => recordVerificationCall(publisherId, { notes: callNotes }),
    onSuccess: () => {
      setCallDialogOpen(false);
      setCallNotes("");
      handleSuccess("Verification call recorded successfully");
    },
    onError: (err: Error) => showToast(err.message || "Failed to record call", "negative"),
  });

  const phoneMutation = useMutation({
    mutationFn: () => confirmUserPhone(profile?.user?._id || ""),
    onSuccess: () => {
      setPhoneConfirmOpen(false);
      handleSuccess("Phone number confirmed");
    },
    onError: (err: Error) => showToast(err.message || "Failed to confirm phone", "negative"),
  });

  const docReviewMutation = useMutation({
    mutationFn: () =>
      reviewDocument(publisherId, reviewingDoc?._id || "", {
        status: docReviewStatus,
        remarks: docRemarks,
      }),
    onSuccess: () => {
      setReviewingDoc(null);
      setDocRemarks("");
      handleSuccess("Document review saved");
    },
    onError: (err: Error) => showToast(err.message || "Failed to review document", "negative"),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveVerification(publisherId),
    onSuccess: () => {
      setApproveDialogOpen(false);
      handleSuccess("Owner approved successfully", true);
    },
    onError: (err: Error) => showToast(err.message || "Approval failed", "negative"),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectVerification(publisherId, { reason }),
    onSuccess: () => {
      setRejectDialogOpen(false);
      handleSuccess("Owner rejected", true);
    },
    onError: (err: Error) => showToast(err.message || "Rejection failed", "negative"),
  });

  const reverifyMutation = useMutation({
    mutationFn: (reason: string) => requestReverification(publisherId, { reason }),
    onSuccess: () => {
      setReverifyDialogOpen(false);
      handleSuccess("New documents requested from owner", true);
    },
    onError: (err: Error) => showToast(err.message || "Failed to request documents", "negative"),
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => suspendUser(profile?.user?._id || "", { reason }),
    onSuccess: () => {
      setSuspendDialogOpen(false);
      handleSuccess("Owner account suspended", true);
    },
    onError: (err: Error) => showToast(err.message || "Suspension failed", "negative"),
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => unsuspendUser(profile?.user?._id || ""),
    onSuccess: () => {
      setUnsuspendDialogOpen(false);
      handleSuccess("Owner account unsuspended", true);
    },
    onError: (err: Error) => showToast(err.message || "Unsuspension failed", "negative"),
  });

  // Calculate approval conditions based on backend rules
  const approvalConditions = useMemo(() => {
    if (!profile) {
      return {
        phoneConfirmed: false,
        callDone: false,
        requiredDocsApproved: false,
        allDocsReviewed: false,
        allMet: false,
      };
    }

    const phoneConfirmed = Boolean(profile.user?.phoneConfirmedByAdmin);
    const callDone = Boolean(profile.verificationCall?.done);

    const docs = profile.documents || [];
    const approvedTypes = docs
      .filter((d) => d.status === "approved")
      .map((d) => d.type);

    let requiredDocsApproved = false;
    if (profile.publisherType === "agent") {
      const hasOwnerId =
        approvedTypes.includes("aadhar") || approvedTypes.includes("pan");
      const hasBizDoc =
        approvedTypes.includes("gst_certificate") ||
        approvedTypes.includes("business_registration") ||
        Boolean(profile.businessName && profile.businessAddress);
      requiredDocsApproved = Boolean(hasOwnerId && hasBizDoc);
    } else {
      const hasPersonalId =
        approvedTypes.includes("aadhar") || approvedTypes.includes("driving_license");
      requiredDocsApproved = Boolean(hasPersonalId);
    }

    const allDocsReviewed = docs.length > 0 && docs.every((d) => d.status !== "pending");

    const allMet =
      phoneConfirmed && callDone && requiredDocsApproved && allDocsReviewed;

    return {
      phoneConfirmed,
      callDone,
      requiredDocsApproved,
      allDocsReviewed,
      allMet,
    };
  }, [profile]);

  // Selected document object
  const selectedDoc = useMemo(() => {
    if (!profile?.documents?.length) return null;
    if (selectedDocId) {
      return profile.documents.find((d) => d._id === selectedDocId) || profile.documents[0];
    }
    return profile.documents[0];
  }, [profile, selectedDocId]);

  if (profileQuery.isLoading) {
    return (
      <AppShell title="Review Owner">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-7 h-96 w-full" />
            <Skeleton className="lg:col-span-5 h-96 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell title="Review Owner">
        <EmptyState
          title="Owner profile not found"
          description="The requested publisher profile could not be loaded or has been deleted."
          action={
            <Link href="/verifications">
              <Button variant="secondary">Back to Queue</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const isAgent = profile.publisherType === "agent";
  const statusMeta = getVerificationStatusMeta(profile.verificationStatus);
  const isSuspended = profile.user?.accountStatus === "suspended";
  const flags = profile.flags || [];
  const unresolvedFlags = flags.filter((f) => !f.resolved);

  return (
    <AppShell
      title={`Review: ${profile.user?.fullName || "Owner"}`}
      contextLine={`Publisher ID: ${profile._id}`}
    >
      <div className="space-y-6">
        {/* Navigation & Preferences Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
          <Link
            href="/verifications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </Link>

          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
            <Checkbox
              checked={returnToQueueOnDecision}
              onChange={(e) => setReturnToQueueOnDecision(e.target.checked)}
            />
            <span>After a decision, return to queue</span>
          </label>
        </div>

        {/* Profile Flags Alert (shown plainly at the top if present) */}
        {unresolvedFlags.length > 0 && (
          <div className="bg-[#FEF6E9] border border-warning/30 rounded p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-ink">
                  Attention: Active Profile Flags ({unresolvedFlags.length})
                </h3>
                <div className="space-y-1.5">
                  {unresolvedFlags.map((flag, idx) => (
                    <div key={idx} className="text-xs text-ink">
                      <span className="font-semibold uppercase">{flag.type}:</span>{" "}
                      <span>{flag.note}</span>
                      <span className="text-ink-soft ml-2">
                        ({formatDateOnly(flag.createdAt)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Facts and Account Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Account Section */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Account Overview
                </h2>
                <div className="flex items-center gap-2">
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  <Badge tone={isAgent ? "brand" : "neutral"}>
                    {isAgent ? "Agent" : "Individual"}
                  </Badge>
                </div>
              </div>

              <DefinitionList className="mt-3">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Full Name</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                    {profile.user?.fullName}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Email Address</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                    <span>{profile.user?.email}</span>
                    <Badge tone={profile.user?.isEmailVerified ? "brand" : "warning"}>
                      {profile.user?.isEmailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Phone Number</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`tel:${profile.user?.phone}`}
                        className="inline-flex items-center gap-1 text-brand font-mono hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {formatPhone(profile.user?.phone)}
                      </a>
                      <CopyButton value={profile.user?.phone} label="Copy phone" />
                      <Badge tone={profile.user?.phoneConfirmedByAdmin ? "brand" : "warning"}>
                        {profile.user?.phoneConfirmedByAdmin ? "Confirmed" : "Unconfirmed"}
                      </Badge>
                      {!profile.user?.phoneConfirmedByAdmin && (
                        <button
                          type="button"
                          onClick={() => setPhoneConfirmOpen(true)}
                          className="text-xs text-brand hover:underline font-semibold"
                        >
                          Confirm phone
                        </button>
                      )}
                    </div>
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Account Status</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center justify-between">
                    <span className="capitalize">{profile.user?.accountStatus || "Active"}</span>
                    {isSuspended ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUnsuspendDialogOpen(true)}
                      >
                        Unsuspend owner
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setSuspendDialogOpen(true)}
                      >
                        Suspend owner
                      </Button>
                    )}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Submitted For Review</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {profile.submittedAt
                      ? `${formatDateTime(profile.submittedAt)} (Waited ${formatWaitingFor(profile.submittedAt)})`
                      : "Not submitted"}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Member Since</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {formatDateOnly(profile.user?.createdAt)}
                  </dd>
                </div>
              </DefinitionList>
            </div>

            {/* Owner Details Section */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                {isAgent ? "Business & Pickup Details" : "Individual Profile Details"}
              </h2>

              {isAgent ? (
                <div className="space-y-4 mt-3">
                  <DefinitionList>
                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                      <dt className="text-xs text-ink-soft font-medium">Business Name</dt>
                      <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                        {profile.businessName || "Not provided"}
                      </dd>
                    </div>

                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                      <dt className="text-xs text-ink-soft font-medium">Business Address</dt>
                      <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                        {profile.businessAddress || "Not provided"}
                      </dd>
                    </div>

                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                      <dt className="text-xs text-ink-soft font-medium">GST Number</dt>
                      <dd className="mt-1 text-sm font-mono text-ink sm:col-span-2 sm:mt-0">
                        {profile.gstNumber || "None registered"}
                      </dd>
                    </div>

                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                      <dt className="text-xs text-ink-soft font-medium">Fixed Pickup Address</dt>
                      <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                        <p>{profile.agentPickup?.address || "Address not provided"}</p>
                        {profile.agentPickup?.landmark && (
                          <p className="text-xs text-ink-soft mt-0.5">
                            Landmark: {profile.agentPickup.landmark}
                          </p>
                        )}
                      </dd>
                    </div>
                  </DefinitionList>

                  {/* OpenStreetMap showing pin and lat/lon */}
                  <div>
                    <span className="block text-xs text-ink-soft font-medium mb-1.5">
                      Fixed Pickup Location Map
                    </span>
                    <OsmMap
                      latitude={profile.agentPickup?.location?.coordinates?.[1] ?? 0}
                      longitude={profile.agentPickup?.location?.coordinates?.[0] ?? 0}
                      label={profile.businessName || "Agent Pickup"}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-3">
                  <DefinitionList>
                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                      <dt className="text-xs text-ink-soft font-medium">City</dt>
                      <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                        {profile.individualArea?.city || "Not provided"}
                      </dd>
                    </div>

                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                      <dt className="text-xs text-ink-soft font-medium">Area</dt>
                      <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                        {profile.individualArea?.area || "Not provided"}
                      </dd>
                    </div>
                  </DefinitionList>

                  {/* Selfie with ID */}
                  <div>
                    <span className="block text-xs text-ink-soft font-medium mb-2">
                      Selfie with ID Card
                    </span>
                    {profile.selfieWithId?.url ? (
                      <ImageViewer
                        src={profile.selfieWithId.url}
                        alt="Selfie with ID"
                        caption="Selfie with ID Card"
                      />
                    ) : (
                      <p className="text-xs text-ink-soft italic">No selfie uploaded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Verification Call Section */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Verification Call
                </h2>
                <Badge tone={profile.verificationCall?.done ? "brand" : "warning"}>
                  {profile.verificationCall?.done ? "Call Recorded" : "Pending Call"}
                </Badge>
              </div>

              <div className="mt-3 space-y-3">
                {profile.verificationCall?.done ? (
                  <div className="text-xs text-ink space-y-1">
                    <p className="font-semibold text-brand">
                      Call completed on {formatDateTime(profile.verificationCall.doneAt)}
                    </p>
                    {profile.verificationCall.notes && (
                      <p className="text-ink-soft mt-1 bg-paper p-2.5 rounded border border-line">
                        {profile.verificationCall.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ink-soft">
                    Mandatory verification call has not been completed. Speak with the owner
                    to verify operations before approving.
                  </p>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCallNotes(profile.verificationCall?.notes || "");
                    setCallDialogOpen(true);
                  }}
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                  {profile.verificationCall?.done ? "Update Call Notes" : "Record Verification Call"}
                </Button>
              </div>
            </div>

            {/* Reliability History */}
            {profile.reliability && (
              <div className="bg-surface border border-line rounded p-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                    Reliability & History
                  </h2>
                  <span className="text-sm font-bold text-ink">
                    Score: {profile.reliability.score}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Requests</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.requestsReceived}
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Accepted</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.accepted}
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Completed</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.completed}
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">No-shows</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.noShows}
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Issues Upheld</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.issuesUpheld}
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Cancelled Late</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.cancelledAfterConfirm}
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Avg Response</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.avgResponseMinutes || 0}m
                    </span>
                  </div>
                  <div className="bg-paper p-2.5 rounded border border-line">
                    <span className="text-ink-soft block">Missed Confirms</span>
                    <span className="font-bold text-ink text-sm">
                      {profile.reliability.missedConfirmations}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection / Reverification Reason History */}
            {profile.rejectionReason && (
              <div className="bg-surface border border-line rounded p-5">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-2 border-b border-line font-display">
                  Last Rejection or Reverification Note
                </h2>
                <p className="text-xs text-ink mt-2 bg-paper p-3 rounded border border-line">
                  {profile.rejectionReason}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Documents and Reviewer Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Review Aid Checklist (kept locally on device) */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-2 border-b border-line font-display">
                Review Checklist
              </h2>
              <p className="text-xs text-ink-soft mt-1 mb-3">
                Visual inspection aid for reviewers. Kept locally in this session.
              </p>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.nameMatches}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, nameMatches: e.target.checked }))
                    }
                  />
                  <span>Name on the ID matches the account name</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.idClearNotExpired}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, idClearNotExpired: e.target.checked }))
                    }
                  />
                  <span>The ID is clear and not expired</span>
                </label>

                {isAgent && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={checklist.bizDetailsGenuine}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, bizDetailsGenuine: e.target.checked }))
                      }
                    />
                    <span>Business details look genuine (agents)</span>
                  </label>
                )}

                {!isAgent && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={checklist.selfieMatches}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, selfieMatches: e.target.checked }))
                      }
                    />
                    <span>Selfie shows the same person and the ID (individuals)</span>
                  </label>
                )}
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Submitted Documents ({profile.documents?.length || 0})
                </h2>
              </div>

              {profile.documents?.length === 0 ? (
                <p className="text-xs text-ink-soft py-4">No documents uploaded.</p>
              ) : (
                <div className="divide-y divide-line mt-2">
                  {profile.documents?.map((doc) => {
                    const isSelected = selectedDoc?._id === doc._id;
                    const docStatus = getDocumentStatusMeta(doc.status);

                    return (
                      <div
                        key={doc._id}
                        className={`py-3 px-2 rounded cursor-pointer transition-colors ${
                          isSelected ? "bg-brand-tint/60" : "hover:bg-paper"
                        }`}
                        onClick={() => setSelectedDocId(doc._id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand" />
                            <span className="text-xs font-semibold text-ink">
                              {getDocumentTypeLabel(doc.type)}
                            </span>
                          </div>
                          <Badge tone={docStatus.tone}>{docStatus.label}</Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-ink-soft mt-1 font-mono">
                          <span>{doc.documentNumberMasked}</span>
                          <span className="font-sans">
                            {formatDateOnly(doc.uploadedAt)}
                          </span>
                        </div>

                        {doc.remarks && (
                          <p className="text-xs text-ink-soft italic mt-1">
                            Remarks: {doc.remarks}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-line/40">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs py-0.5 h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewingDoc(doc);
                              setDocReviewStatus("approved");
                              setDocRemarks(doc.remarks || "");
                            }}
                          >
                            Approve doc
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="text-xs py-0.5 h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewingDoc(doc);
                              setDocReviewStatus("rejected");
                              setDocRemarks(doc.remarks || "");
                            }}
                          >
                            Reject doc
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Document Viewer */}
            {selectedDoc && (
              <div className="bg-surface border border-line rounded p-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h3 className="text-xs font-semibold text-ink uppercase tracking-wider font-display truncate">
                    Viewer: {getDocumentTypeLabel(selectedDoc.type)}
                  </h3>
                  <a
                    href={selectedDoc.file?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium shrink-0"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="mt-3">
                  {selectedDoc.file?.url?.toLowerCase().endsWith(".pdf") ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] bg-paper rounded border border-line p-4 text-center">
                      <p className="text-xs text-ink-soft mb-2">
                        PDF Document ({selectedDoc.documentNumberMasked})
                      </p>
                      <a
                        href={selectedDoc.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <span>View full PDF</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <iframe
                        src={selectedDoc.file.url}
                        title={getDocumentTypeLabel(selectedDoc.type)}
                        className="w-full h-80 mt-3 border border-line rounded"
                      />
                    </div>
                  ) : (
                    <ImageViewer
                      src={selectedDoc.file?.url || ""}
                      alt={getDocumentTypeLabel(selectedDoc.type)}
                      caption={`${getDocumentTypeLabel(selectedDoc.type)} (${selectedDoc.documentNumberMasked})`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval Conditions Panel (Above the Action Bar) */}
        <div className="bg-surface border border-line rounded p-5">
          <h2 className="text-sm font-semibold text-ink font-display pb-2 border-b border-line">
            Approval Conditions Check
          </h2>
          <p className="text-xs text-ink-soft mt-1 mb-3">
            All mandatory conditions enforced by the platform must be satisfied before approval.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded border border-line bg-paper">
              {approvalConditions.phoneConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-negative shrink-0" />
              )}
              <span className={approvalConditions.phoneConfirmed ? "text-ink font-medium" : "text-ink-soft"}>
                Phone confirmed by admin
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded border border-line bg-paper">
              {approvalConditions.callDone ? (
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-negative shrink-0" />
              )}
              <span className={approvalConditions.callDone ? "text-ink font-medium" : "text-ink-soft"}>
                Verification call recorded
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded border border-line bg-paper">
              {approvalConditions.requiredDocsApproved ? (
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-negative shrink-0" />
              )}
              <span className={approvalConditions.requiredDocsApproved ? "text-ink font-medium" : "text-ink-soft"}>
                Required KYC docs approved
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded border border-line bg-paper">
              {approvalConditions.allDocsReviewed ? (
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-negative shrink-0" />
              )}
              <span className={approvalConditions.allDocsReviewed ? "text-ink font-medium" : "text-ink-soft"}>
                All submitted docs reviewed
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
          info={
            <span>
              Owner status: <strong>{statusMeta.label}</strong>
            </span>
          }
        >
          <Button
            variant="secondary"
            onClick={() => setReverifyDialogOpen(true)}
          >
            Ask for new documents
          </Button>

          <Button
            variant="danger"
            onClick={() => setRejectDialogOpen(true)}
          >
            Reject
          </Button>

          <Button
            variant="primary"
            disabled={!approvalConditions.allMet || approveMutation.isPending}
            onClick={() => setApproveDialogOpen(true)}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Approve owner
          </Button>
        </StickyActionBar>

        {/* Dialog 1: Record Verification Call */}
        <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
          <DialogContent title="Record Verification Call" className="max-w-md">
            <div className="space-y-4">
              <p className="text-xs text-ink-soft">
                Record details of the verification call conducted with{" "}
                <strong>{profile.user?.fullName}</strong>.
              </p>

              <Field
                label="Call Outcome Notes"
                required
                hint="Summarize owner conversation, operations, and vehicle readiness."
              >
                <Textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Spoke with owner. Details and fixed pickup address verified."
                  rows={4}
                />
              </Field>

              <p className="text-xs text-ink-soft italic">
                This action is recorded in the audit log.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  variant="quiet"
                  onClick={() => setCallDialogOpen(false)}
                  disabled={callMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => callMutation.mutate()}
                  isLoading={callMutation.isPending}
                >
                  Save Call Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog 2: Single Document Review Modal */}
        <Dialog
          open={Boolean(reviewingDoc)}
          onOpenChange={(open) => !open && setReviewingDoc(null)}
        >
          <DialogContent title="Review Document" className="max-w-md">
            {reviewingDoc && (
              <div className="space-y-4">
                <div className="bg-paper p-3 rounded border border-line text-xs space-y-1">
                  <p>
                    <strong>Type:</strong> {getDocumentTypeLabel(reviewingDoc.type)}
                  </p>
                  <p>
                    <strong>Number:</strong> {reviewingDoc.documentNumberMasked}
                  </p>
                </div>

                <Field label="Decision" required>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="docStatus"
                        checked={docReviewStatus === "approved"}
                        onChange={() => setDocReviewStatus("approved")}
                        className="text-brand focus:ring-brand"
                      />
                      <span>Approve</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="docStatus"
                        checked={docReviewStatus === "rejected"}
                        onChange={() => setDocReviewStatus("rejected")}
                        className="text-brand focus:ring-brand"
                      />
                      <span>Reject</span>
                    </label>
                  </div>
                </Field>

                <Field
                  label="Remarks"
                  required={docReviewStatus === "rejected"}
                  hint={
                    docReviewStatus === "rejected"
                      ? "Required: explain why this document is rejected"
                      : "Optional remarks"
                  }
                >
                  <Textarea
                    value={docRemarks}
                    onChange={(e) => setDocRemarks(e.target.value)}
                    placeholder={
                      docReviewStatus === "rejected"
                        ? "Document expired or unreadable"
                        : "Verified against database"
                    }
                    rows={3}
                  />
                </Field>

                <p className="text-xs text-ink-soft italic">
                  This action is recorded in the audit log.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <Button
                    variant="quiet"
                    onClick={() => setReviewingDoc(null)}
                    disabled={docReviewMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={
                      docReviewStatus === "rejected" && docRemarks.trim().length === 0
                    }
                    isLoading={docReviewMutation.isPending}
                    onClick={() => docReviewMutation.mutate()}
                  >
                    Save Review
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog 3: Confirm Phone */}
        <ConfirmDialog
          open={phoneConfirmOpen}
          onOpenChange={setPhoneConfirmOpen}
          title="Confirm Phone Number"
          description={`Confirm that phone number ${formatPhone(profile.user?.phone)} was verified directly by the platform team.`}
          targetName={profile.user?.fullName}
          actionLabel="Confirm Phone"
          actionVariant="primary"
          isLoading={phoneMutation.isPending}
          onConfirm={() => phoneMutation.mutate()}
        />

        {/* Dialog 4: Approve Owner */}
        <ConfirmDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          title="Approve Owner Verification"
          description="Approving will activate the publisher profile, notify the owner, and allow publishing vehicles."
          targetName={profile.user?.fullName}
          actionLabel="Approve Owner"
          actionVariant="primary"
          isLoading={approveMutation.isPending}
          onConfirm={() => approveMutation.mutate()}
        />

        {/* Dialog 5: Reject Owner */}
        <ConfirmDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          title="Reject Owner Verification"
          description="The owner will see this reason and can fix the problem and submit again."
          targetName={profile.user?.fullName}
          actionLabel="Reject Verification"
          actionVariant="danger"
          requireNote
          noteLabel="Rejection Reason"
          notePlaceholder="Explain clearly why verification is rejected..."
          isLoading={rejectMutation.isPending}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
        />

        {/* Dialog 6: Request Reverification */}
        <ConfirmDialog
          open={reverifyDialogOpen}
          onOpenChange={setReverifyDialogOpen}
          title="Ask for New Documents"
          description="Specify which documents or details are needed. The owner will receive this message and be prompted to re-upload."
          targetName={profile.user?.fullName}
          actionLabel="Send Request"
          actionVariant="primary"
          requireNote
          noteLabel="Documents Needed & Instructions"
          notePlaceholder="Please upload a clearer copy of your Aadhaar card and address proof..."
          isLoading={reverifyMutation.isPending}
          onConfirm={(reason) => reverifyMutation.mutate(reason)}
        />

        {/* Dialog 7: Suspend Owner */}
        <ConfirmDialog
          open={suspendDialogOpen}
          onOpenChange={setSuspendDialogOpen}
          title="Suspend Owner Account"
          description="Suspending this account will immediately revoke access and prevent any vehicle listings or bookings."
          targetName={profile.user?.fullName}
          actionLabel="Suspend Account"
          actionVariant="danger"
          requireNote
          noteLabel="Suspension Reason"
          notePlaceholder="Policy violation or suspected fraudulent activity..."
          isLoading={suspendMutation.isPending}
          onConfirm={(reason) => suspendMutation.mutate(reason)}
        />

        {/* Dialog 8: Unsuspend Owner */}
        <ConfirmDialog
          open={unsuspendDialogOpen}
          onOpenChange={setUnsuspendDialogOpen}
          title="Unsuspend Owner Account"
          description="This will restore active account status and reinstate access."
          targetName={profile.user?.fullName}
          actionLabel="Unsuspend Account"
          actionVariant="primary"
          isLoading={unsuspendMutation.isPending}
          onConfirm={() => unsuspendMutation.mutate()}
        />
      </div>
    </AppShell>
  );
}
