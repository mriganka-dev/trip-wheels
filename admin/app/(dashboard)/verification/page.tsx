"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  PhoneCall,
  ShieldAlert,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getOwnDocuments, submitVerification } from "@/lib/api/publisher";
import { ApiError } from "@/lib/api/client";
import { getVerificationStatusMeta } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/layout/app-shell";
import {
  confirmTestNotification,
  getPushPermissionState,
  isPushSupported,
  sendTestNotification,
  subscribeToPush,
} from "@/lib/push";
import { isIosSafari, isStandalone } from "@/lib/pwa";
import type { VerificationDocument } from "@/types/verification";

export default function VerificationPage() {
  const { user, profile, refetchProfile, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Push notifications & PWA state
  const [pushPermission, setPushPermission] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");
  const [isIos, setIsIos] = useState(false);
  const [isStand, setIsStand] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isConfirmingTest, setIsConfirmingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPushPermission(getPushPermissionState());
      setIsIos(isIosSafari());
      setIsStand(isStandalone());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isNotificationsConfirmed = Boolean(
    profile?.notificationsTestConfirmedAt
  );

  const handleTurnOnPush = async () => {
    setPushError(null);
    if (!isPushSupported()) {
      setPushError("Push notifications are not supported on this browser.");
      return;
    }
    setIsEnablingPush(true);
    try {
      await subscribeToPush();
      setPushPermission("granted");
      showToast("Push notifications enabled.", "brand");
    } catch (err) {
      setPushPermission(getPushPermissionState());
      setPushError(
        err instanceof Error ? err.message : "Failed to enable notifications."
      );
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleSendTestNotification = async () => {
    setPushError(null);
    setIsSendingTest(true);
    try {
      await sendTestNotification();
      setTestSent(true);
      showToast("Test notification sent! Check your device.", "brand");
    } catch (err) {
      setPushError(
        err instanceof Error
          ? err.message
          : "Failed to send test notification."
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleConfirmTest = async () => {
    setPushError(null);
    setIsConfirmingTest(true);
    try {
      await confirmTestNotification();
      await refetchProfile();
      showToast("Notification receipt confirmed!", "brand");
    } catch (err) {
      setPushError(
        err instanceof Error
          ? err.message
          : "Failed to confirm test notification."
      );
    } finally {
      setIsConfirmingTest(false);
    }
  };

  const { data: documents = [], refetch: refetchDocs } = useQuery<VerificationDocument[]>({
    queryKey: queryKeys.publisher.documents,
    queryFn: getOwnDocuments,
    enabled: Boolean(user),
  });

  const isAgent = user?.role === "agent";
  const status = profile?.verificationStatus ?? "not_submitted";
  const statusMeta = getVerificationStatusMeta(status);
  const isPending = status === "pending";
  const isApproved = status === "approved";

  // Check 1: Email verified
  const isEmailVerified = Boolean(user?.isEmailVerified);
  const isGoogleUser = Boolean(user?.authProviders?.includes("google"));

  // Check 2: Profile completed
  const hasProfile = isAgent
    ? Boolean(
        profile?.businessName &&
          profile?.businessAddress &&
          profile?.destination &&
          profile?.agentPickup?.address &&
          profile?.agentPickup?.location?.coordinates &&
          !(
            profile.agentPickup.location.coordinates[0] === 0 &&
            profile.agentPickup.location.coordinates[1] === 0
          )
      )
    : Boolean(
        profile?.individualArea?.city &&
          profile?.individualArea?.area &&
          profile?.destination
      );

  // Check 3: Required documents uploaded
  const activeDocs = documents.filter((d) => d.status !== "rejected");
  const docTypes = activeDocs.map((d) => d.type);

  const hasOwnerId = isAgent
    ? docTypes.includes("aadhar") || docTypes.includes("pan")
    : docTypes.includes("aadhar") || docTypes.includes("driving_license");

  const hasBusinessDoc = isAgent
    ? docTypes.includes("gst_certificate") ||
      docTypes.includes("business_registration") ||
      Boolean(profile?.businessName && profile?.businessAddress)
    : true;

  const hasRequiredDocs = hasOwnerId && hasBusinessDoc;

  // Check 4: Selfie with ID (for individuals)
  const hasSelfie = isAgent ? true : Boolean(profile?.selfieWithId?.url);

  // Check 5: Submitted
  const isSubmitted = status !== "not_submitted";

  // Check 6: Verification call
  const isCallDone = Boolean(profile?.verificationCall?.done);

  // Ready to submit?
  const canSubmit =
    isEmailVerified &&
    hasProfile &&
    hasRequiredDocs &&
    hasSelfie &&
    !isPending &&
    !isApproved;

  const missingItems: string[] = [];
  if (!isEmailVerified) missingItems.push("Verify your email address");
  if (!hasProfile) {
    missingItems.push(isAgent ? "Complete business details and pickup pin" : "Complete area details");
  }
  if (!hasOwnerId) {
    missingItems.push(isAgent ? "Upload Owner ID (Aadhar or PAN)" : "Upload Personal ID (Aadhar or Driving License)");
  }
  if (isAgent && !hasBusinessDoc) {
    missingItems.push("Provide business registration or GST certificate");
  }
  if (!isAgent && !hasSelfie) {
    missingItems.push("Upload selfie holding your ID");
  }

  const handleSubmitForReview = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitVerification();
      await Promise.all([refetchProfile(), refetchDocs()]);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message || "Could not submit verification. Please check missing items.");
      } else {
        setSubmitError("Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="p-8 text-center text-sm text-(--ink-soft)">
        Loading verification checklist...
      </div>
    );
  }

  return (
    <AppShell title="Verification" subtitle="Onboarding status and document review">
      <div className="flex flex-col gap-8 max-w-3xl">
        {/* Status Header */}
      <div className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-(--ink-soft)">
              Current status
            </span>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-(--ink)">
                Verification
              </h1>
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            </div>
          </div>

          {profile?.submittedAt && (
            <div className="text-right text-xs text-(--ink-soft)">
              Submitted on <br />
              <strong className="text-(--ink)">{formatDate(profile.submittedAt)}</strong>
            </div>
          )}
        </div>

        {/* Status Explanation */}
        {status === "not_submitted" && (
          <p className="text-sm text-(--ink-soft) leading-relaxed">
            Complete the checklist items below and submit your profile for admin verification. Your vehicles become visible to customers once approved.
          </p>
        )}

        {status === "pending" && (
          <div className="p-4 rounded-md bg-(--brand-tint)/40 border border-(--brand) text-sm text-(--ink) flex items-start gap-3">
            <Clock className="w-5 h-5 text-(--brand-dark) shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-(--brand-dark)">
                Application under review
              </p>
              <p className="mt-1 text-xs text-(--ink-soft) leading-relaxed">
                Our verification team is reviewing your documents. We will contact you by phone on your registered number to confirm your details. Profile editing is paused while under review.
              </p>
            </div>
          </div>
        )}

        {status === "approved" && (
          <div className="p-4 rounded-md bg-(--brand-tint)/50 border border-(--brand) text-sm text-(--ink) flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-(--brand-dark) shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-(--brand-dark)">
                Partner account approved
              </p>
              <p className="mt-1 text-xs text-(--ink-soft) leading-relaxed">
                Your partner verification is complete. You can now add vehicles, manage your calendar, and accept traveler booking requests.
              </p>
            </div>
          </div>
        )}

        {(status === "rejected" || status === "reverification_required") && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-(--ink) flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-(--negative) shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-(--negative)">
                {status === "rejected" ? "Verification not approved" : "New documents needed"}
              </p>
              <p className="mt-1 text-xs text-(--ink-soft) leading-relaxed">
                {profile?.rejectionReason || "Please review your details and re-upload the requested documents."}
              </p>
              <div className="mt-3">
                <Link href="/verification/documents">
                  <Button variant="secondary" size="sm">
                    Review and replace documents
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold font-display text-(--ink)">
          Verification checklist
        </h2>

        <div className="divide-y divide-(--line) rounded-md border border-(--line) bg-(--surface)">
          {/* Item 1: Email */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className={`w-5 h-5 shrink-0 ${isEmailVerified ? "text-(--brand)" : "text-(--ink-soft)/40"}`}
              />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  1. Email verified
                </span>
                <p className="text-xs text-(--ink-soft)">
                  {isGoogleUser ? "Verified automatically with Google" : user?.email}
                </p>
              </div>
            </div>
            {isEmailVerified ? (
              <Badge tone="brand">Done</Badge>
            ) : (
              <Link href={`/verify-email?email=${encodeURIComponent(user?.email || "")}`}>
                <Button variant="secondary" size="sm">
                  Verify now
                </Button>
              </Link>
            )}
          </div>

          {/* Item 2: Profile details */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className={`w-5 h-5 shrink-0 ${hasProfile ? "text-(--brand)" : "text-(--ink-soft)/40"}`}
              />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  2. {isAgent ? "Business details and pickup location" : "Pickup area and destination"}
                </span>
                <p className="text-xs text-(--ink-soft)">
                  {hasProfile
                    ? isAgent
                      ? `${profile?.businessName} (${profile?.agentPickup?.address || "Pin set"})`
                      : `${profile?.individualArea?.area}, ${profile?.individualArea?.city}`
                    : "Not completed yet"}
                </p>
              </div>
            </div>
            {isPending ? (
              <Badge tone="neutral">Locked</Badge>
            ) : (
              <Link href="/verification/profile">
                <Button variant="secondary" size="sm">
                  {hasProfile ? "Edit" : "Complete"}
                </Button>
              </Link>
            )}
          </div>

          {/* Item 3: Required documents */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText
                className={`w-5 h-5 shrink-0 ${hasRequiredDocs ? "text-(--brand)" : "text-(--ink-soft)/40"}`}
              />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  3. Identity & business documents
                </span>
                <p className="text-xs text-(--ink-soft)">
                  {documents.length > 0
                    ? `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded`
                    : "Upload required ID documents"}
                </p>
              </div>
            </div>
            {isPending ? (
              <Badge tone="neutral">In review</Badge>
            ) : (
              <Link href="/verification/documents">
                <Button variant="secondary" size="sm">
                  {hasRequiredDocs ? "Manage" : "Upload"}
                </Button>
              </Link>
            )}
          </div>

          {/* Item 4: Selfie (individual) */}
          {!isAgent && (
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserCheck
                  className={`w-5 h-5 shrink-0 ${hasSelfie ? "text-(--brand)" : "text-(--ink-soft)/40"}`}
                />
                <div>
                  <span className="text-sm font-medium text-(--ink)">
                    4. Selfie holding ID
                  </span>
                  <p className="text-xs text-(--ink-soft)">
                    {hasSelfie ? "Selfie uploaded" : "Take a photo holding your government ID"}
                  </p>
                </div>
              </div>
              {isPending ? (
                <Badge tone="neutral">In review</Badge>
              ) : (
                <Link href="/verification/documents">
                  <Button variant="secondary" size="sm">
                    {hasSelfie ? "Change" : "Upload"}
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Item 5: Submitted for review */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock
                className={`w-5 h-5 shrink-0 ${isSubmitted ? "text-(--brand)" : "text-(--ink-soft)/40"}`}
              />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  {isAgent ? "4. Submitted for review" : "5. Submitted for review"}
                </span>
                <p className="text-xs text-(--ink-soft)">
                  {isSubmitted ? "Submitted to admin team" : "Send profile for verification review"}
                </p>
              </div>
            </div>
            <Badge tone={isSubmitted ? "brand" : "neutral"}>
              {isSubmitted ? "Submitted" : "Pending"}
            </Badge>
          </div>

          {/* Item 6: Verification Call */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PhoneCall
                className={`w-5 h-5 shrink-0 ${isCallDone ? "text-(--brand)" : "text-(--ink-soft)/40"}`}
              />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  {isAgent ? "5. Verification call" : "6. Verification call"}
                </span>
                <p className="text-xs text-(--ink-soft) max-w-md">
                  Our team will call you on your registered number to confirm it. Approval needs this call.
                </p>
                {isGoogleUser && (
                  <p className="text-xs text-(--ink-soft) max-w-md mt-1">
                    The verification call confirms the phone number you saved.
                  </p>
                )}
              </div>
            </div>
            <Badge tone={isCallDone ? "brand" : "warning"}>
              {isCallDone ? "Completed" : "Awaiting call"}
            </Badge>
          </div>

          {/* Item 6 (Agent) or 7 (Individual): App installed and push notifications */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bell
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isNotificationsConfirmed
                      ? "text-(--brand)"
                      : "text-(--ink-soft)/40"
                  }`}
                />
                <div>
                  <span className="text-sm font-medium text-(--ink)">
                    {isAgent
                      ? "6. App installed and notifications"
                      : "7. App installed and notifications"}
                  </span>
                  <p className="text-xs text-(--ink-soft) max-w-md">
                    Receive immediate booking requests, vehicle confirmation alerts, and trip updates on your device.
                  </p>
                </div>
              </div>

              <div>
                {isNotificationsConfirmed ? (
                  <Badge tone="brand">Done</Badge>
                ) : pushPermission === "granted" ? (
                  <Badge tone="brand">Subscribed</Badge>
                ) : pushPermission === "denied" ? (
                  <Badge tone="negative">Blocked</Badge>
                ) : (
                  <Badge tone="neutral">Pending</Badge>
                )}
              </div>
            </div>

            <div className="ml-8 rounded border border-(--line) bg-(--surface-soft)/40 p-3 space-y-3">
              {pushError && (
                <div className="flex items-start gap-2 text-xs text-(--negative)">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pushError}</span>
                </div>
              )}

              {isNotificationsConfirmed ? (
                <p className="text-xs text-(--ink-soft)">
                  Push notifications verified and confirmed.
                  {profile?.notificationsTestConfirmedAt && (
                    <span>
                      {" "}
                      (Confirmed {formatDate(profile.notificationsTestConfirmedAt)})
                    </span>
                  )}
                </p>
              ) : (
                <>
                  {pushPermission !== "granted" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-(--ink-soft)">
                        We will alert you when a customer sends a request, when you need to confirm a vehicle, and when something changes on a trip.
                      </p>
                      {pushPermission === "denied" ? (
                        <p className="text-xs text-rose-700">
                          Notifications are blocked in your browser. Please enable notifications for this site in your browser or device settings.
                        </p>
                      ) : isIos && !isStand ? (
                        <p className="text-xs text-(--ink-soft)">
                          On iPhone, push alerts require adding the app to your Home Screen first (tap Share in Safari, then select &ldquo;Add to Home Screen&rdquo;).
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={isEnablingPush}
                          onClick={handleTurnOnPush}
                        >
                          Turn on notifications
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-(--ink-soft)">
                        Push permission granted. Send a test alert to your device to verify delivery, then confirm receipt below.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={isSendingTest}
                          onClick={handleSendTestNotification}
                        >
                          Send a test notification
                        </Button>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          isLoading={isConfirmingTest}
                          onClick={handleConfirmTest}
                        >
                          I received it
                        </Button>

                        {testSent && (
                          <span className="text-xs text-(--brand) font-medium self-center">
                            Test alert dispatched.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isStand && (
                <div className="pt-2 border-t border-(--line) flex items-center gap-2 text-[11px] text-(--ink-soft)">
                  <Smartphone className="w-3.5 h-3.5 text-(--brand)" />
                  <span>
                    Install the partner app on your home screen for rapid access and foreground alerts.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Actions */}
      {!isApproved && !isPending && (
        <div className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold font-display text-(--ink)">
              Ready to submit?
            </h3>
            <p className="mt-1 text-xs text-(--ink-soft)">
              Once submitted, our team inspects your identity and business credentials. Approval takes up to 24 hours.
            </p>
          </div>

          {missingItems.length > 0 && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-(--warning)">
              <span className="font-semibold">Missing before you can submit:</span>
              <ul className="mt-1.5 list-disc list-inside flex flex-col gap-1">
                {missingItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <p role="alert" className="text-xs text-(--negative)">
              {submitError}
            </p>
          )}

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleSubmitForReview}
              className="w-full sm:w-auto"
            >
              Submit for review
            </Button>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
