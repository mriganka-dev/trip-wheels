"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { DefinitionList } from "@/components/ui/definition-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  confirmUserPhone,
  getAdminUserDetail,
  suspendUser,
  unsuspendUser,
} from "@/lib/api/users";
import {
  getAccountStatusMeta,
  getRoleLabel,
  getVehicleStatusMeta,
  getVerificationStatusMeta,
} from "@/lib/constants";
import { formatDateOnly, formatDateTime, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user: currentAdmin } = useAuth();

  const userId = params?.id as string;

  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState<boolean>(false);
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState<boolean>(false);
  const [confirmPhoneDialogOpen, setConfirmPhoneDialogOpen] = useState<boolean>(false);

  // Query user detail
  const userDetailQuery = useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => getAdminUserDetail(userId),
    enabled: Boolean(userId),
    refetchInterval: 60000,
  });

  const detail = userDetailQuery.data;
  const targetUser = detail?.user;

  usePageTitle(targetUser ? `User: ${targetUser.fullName}` : "User Detail");

  // Mutations
  const confirmPhoneMutation = useMutation({
    mutationFn: () => confirmUserPhone(userId),
    onSuccess: () => {
      showToast("Phone number confirmed by admin", "brand");
      setConfirmPhoneDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to confirm phone", "negative");
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => suspendUser(userId, { reason }),
    onSuccess: () => {
      showToast("User account suspended", "brand");
      setSuspendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to suspend account", "negative");
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => unsuspendUser(userId),
    onSuccess: () => {
      showToast("User account unsuspended", "brand");
      setUnsuspendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to unsuspend account", "negative");
    },
  });

  if (userDetailQuery.isLoading) {
    return (
      <AppShell title="User Detail">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (userDetailQuery.isError || !targetUser) {
    return (
      <AppShell title="User Not Found">
        <EmptyState
          title="User Not Found"
          description={
            userDetailQuery.error?.message ||
            "The requested account does not exist or access is restricted."
          }
          action={
            <Button variant="secondary" onClick={() => router.push("/users")}>
              Back to Users
            </Button>
          }
        />
      </AppShell>
    );
  }

  const isSelf = currentAdmin?._id === targetUser._id;
  const isAdminTarget = targetUser.role === "admin";
  const canPerformActions = !isSelf && !isAdminTarget;

  const isCustomer = targetUser.role === "customer";
  const isPublisher = targetUser.role === "agent" || targetUser.role === "individual";

  const statusMeta = getAccountStatusMeta(targetUser.accountStatus);
  const publisherProfile = detail.profile;
  const vehicles = detail.vehicles || [];

  return (
    <AppShell
      title={`User: ${targetUser.fullName}`}
      contextLine={`Role: ${getRoleLabel(targetUser.role)} | Status: ${statusMeta.label} | Joined: ${formatDateOnly(
        targetUser.createdAt
      )}`}
    >
      <div className="space-y-6 max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Users
          </Link>
          <div className="flex items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <Badge tone="neutral">{getRoleLabel(targetUser.role)}</Badge>
          </div>
        </div>

        {/* Admin or Self Restriction Notice */}
        {!canPerformActions && (
          <div className="p-3 bg-paper border border-line rounded text-xs text-ink-soft flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-ink-soft shrink-0" />
            {isSelf ? (
              <span>This is your own account. Administrative moderation actions are disabled.</span>
            ) : (
              <span>This is an administrator account. Administrative moderation actions are disabled.</span>
            )}
          </div>
        )}

        {/* 1. Account Facts */}
        <section className="bg-surface border border-line rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
              1. Account Information
            </h2>
            {canPerformActions && (
              <div className="flex items-center gap-2">
                {!targetUser.phoneConfirmedByAdmin && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmPhoneDialogOpen(true)}
                  >
                    Confirm Phone
                  </Button>
                )}
                {targetUser.accountStatus === "active" ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setSuspendDialogOpen(true)}
                  >
                    Suspend Account
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setUnsuspendDialogOpen(true)}
                  >
                    Unsuspend Account
                  </Button>
                )}
              </div>
            )}
          </div>

          <DefinitionList className="mt-3">
            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Full Name</dt>
              <dd className="mt-1 text-sm font-bold text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                <span>{targetUser.fullName}</span>
                <CopyButton value={targetUser.fullName} label="Copy name" />
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Email Address</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                <span>{targetUser.email}</span>
                <CopyButton value={targetUser.email} label="Copy email" />
                {targetUser.isEmailVerified ? (
                  <Badge tone="brand">Verified</Badge>
                ) : (
                  <Badge tone="warning">Not verified</Badge>
                )}
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Phone Number</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                <a
                  href={`tel:${targetUser.phone}`}
                  className="font-mono font-medium text-brand hover:underline inline-flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {formatPhone(targetUser.phone)}
                </a>
                <CopyButton value={targetUser.phone} label="Copy phone" />
                {targetUser.phoneConfirmedByAdmin ? (
                  <span className="text-xs text-brand font-medium inline-flex items-center gap-1 ml-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Confirmed by admin
                  </span>
                ) : (
                  <span className="text-xs text-ink-soft ml-2">Unconfirmed</span>
                )}
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Account Status</dt>
              <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                {targetUser.suspendedReason && (
                  <p className="text-xs text-negative mt-1">
                    <strong>Suspension reason:</strong> {targetUser.suspendedReason}
                  </p>
                )}
              </dd>
            </div>

            <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
              <dt className="text-xs text-ink-soft font-medium">Joined & Sign In</dt>
              <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0 space-y-0.5">
                <p>Created: {formatDateTime(targetUser.createdAt)}</p>
                <p>
                  Last sign in:{" "}
                  {targetUser.lastLoginAt ? formatDateTime(targetUser.lastLoginAt) : "Never signed in"}
                </p>
              </dd>
            </div>
          </DefinitionList>
        </section>

        {/* 2. Customer Specific Details */}
        {isCustomer && (
          <section className="bg-surface border border-line rounded p-5">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
              2. Customer Reliability & Activity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="p-3 bg-paper/40 border border-line rounded text-xs space-y-1">
                <p className="text-ink-soft">Reliability Score</p>
                <p className="text-lg font-bold text-brand font-mono">
                  {targetUser.reliability?.score ?? 100}/100
                </p>
              </div>
              <div className="p-3 bg-paper/40 border border-line rounded text-xs space-y-1">
                <p className="text-ink-soft">Completed Trips</p>
                <p className="text-lg font-bold text-ink font-mono">
                  {targetUser.reliability?.completedBookings ?? 0}
                </p>
              </div>
              <div className="p-3 bg-paper/40 border border-line rounded text-xs space-y-1">
                <p className="text-ink-soft">Cancellations</p>
                <p className="text-lg font-bold text-ink font-mono">
                  {targetUser.reliability?.cancellations ?? 0}
                </p>
              </div>
              <div className="p-3 bg-paper/40 border border-line rounded text-xs space-y-1">
                <p className="text-ink-soft">Issues Upheld</p>
                <p className="text-lg font-bold text-negative font-mono">
                  {targetUser.reliability?.issuesUpheld ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-line text-xs">
              <Link
                href={`/bookings?search=${encodeURIComponent(targetUser.email)}`}
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
              >
                <span>Find customer bookings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <span className="text-line">|</span>
              <Link
                href={`/issues?search=${encodeURIComponent(targetUser.fullName)}`}
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
              >
                <span>Find customer issues</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* 3. Owner (Agent / Individual) Specific Details */}
        {isPublisher && (
          <div className="space-y-6">
            {/* Publisher Profile Facts */}
            <section className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  2. Owner Profile & Verification
                </h2>
                {publisherProfile && (
                  <Link
                    href={`/verifications/${publisherProfile._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <span>Full owner review page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {publisherProfile ? (
                <DefinitionList className="mt-3">
                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Publisher Type</dt>
                    <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0 uppercase">
                      {publisherProfile.publisherType}
                    </dd>
                  </div>

                  {publisherProfile.publisherType === "agent" && (
                    <>
                      <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                        <dt className="text-xs text-ink-soft font-medium">Business Name</dt>
                        <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                          {publisherProfile.businessName || "Not provided"}
                        </dd>
                      </div>
                      <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                        <dt className="text-xs text-ink-soft font-medium">GST Number</dt>
                        <dd className="mt-1 text-sm font-mono text-ink sm:col-span-2 sm:mt-0">
                          {publisherProfile.gstNumber || "Not recorded"}
                        </dd>
                      </div>
                    </>
                  )}

                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Verification Status</dt>
                    <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                      <Badge
                        tone={
                          getVerificationStatusMeta(publisherProfile.verificationStatus).tone
                        }
                      >
                        {getVerificationStatusMeta(publisherProfile.verificationStatus).label}
                      </Badge>
                    </dd>
                  </div>

                  <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                    <dt className="text-xs text-ink-soft font-medium">Reliability Metrics</dt>
                    <dd className="mt-1 text-xs text-ink sm:col-span-2 sm:mt-0 space-y-1">
                      <p>
                        Score:{" "}
                        <strong className="text-brand text-sm">
                          {publisherProfile.reliability?.score ?? 100}/100
                        </strong>
                      </p>
                      <p>
                        Requests received:{" "}
                        {publisherProfile.reliability?.requestsReceived ?? 0} | Accepted:{" "}
                        {publisherProfile.reliability?.accepted ?? 0} | Completed:{" "}
                        {publisherProfile.reliability?.completed ?? 0}
                      </p>
                      <p>
                        Cancellations after confirm:{" "}
                        {publisherProfile.reliability?.cancelledAfterConfirm ?? 0} | Missed confirmations:{" "}
                        {publisherProfile.reliability?.missedConfirmations ?? 0}
                      </p>
                    </dd>
                  </div>
                </DefinitionList>
              ) : (
                <p className="text-xs text-ink-soft py-4">No publisher profile linked.</p>
              )}
            </section>

            {/* Owner Vehicles */}
            <section className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  3. Registered Vehicles ({vehicles.length})
                </h2>
                <Link
                  href={`/vehicles?search=${encodeURIComponent(targetUser.fullName)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  <span>View in vehicles queue</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {vehicles.length > 0 ? (
                <div className="divide-y divide-line mt-3">
                  {vehicles.map((v) => {
                    const vMeta = getVehicleStatusMeta(v.status);
                    return (
                      <div
                        key={v._id}
                        className="py-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-ink">
                            {v.brand} {v.model} ({v.type})
                          </p>
                          <p className="font-mono text-ink-soft text-[11px]">
                            {v.registrationNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone={vMeta.tone}>{vMeta.label}</Badge>
                          <Link
                            href={`/vehicles/${v._id}`}
                            className="font-semibold text-brand hover:underline"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-ink-soft py-4">No vehicles registered yet.</p>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Confirm Phone Dialog */}
      <ConfirmDialog
        open={confirmPhoneDialogOpen}
        onOpenChange={setConfirmPhoneDialogOpen}
        title="Confirm Phone Number"
        description="Mark this user's phone number as verified by admin. This satisfies one of the requirements for owner verification."
        targetName={targetUser.phone}
        actionLabel="Confirm Phone"
        actionVariant="primary"
        isLoading={confirmPhoneMutation.isPending}
        onConfirm={() => confirmPhoneMutation.mutate()}
      />

      {/* Suspend User Dialog */}
      <ConfirmDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        title="Suspend Account"
        description="Suspending this account immediately halts active sessions and prevents further bookings or requests."
        targetName={targetUser.fullName}
        actionLabel="Suspend Account"
        actionVariant="danger"
        requireNote={true}
        noteLabel="Suspension reason (Required)"
        notePlaceholder="Explain why this account is being suspended..."
        isLoading={suspendMutation.isPending}
        onConfirm={(reason) => suspendMutation.mutate(reason)}
      />

      {/* Unsuspend User Dialog */}
      <ConfirmDialog
        open={unsuspendDialogOpen}
        onOpenChange={setUnsuspendDialogOpen}
        title="Unsuspend Account"
        description="Restore active standing for this account, allowing the user to sign in and resume platform activities."
        targetName={targetUser.fullName}
        actionLabel="Unsuspend Account"
        actionVariant="primary"
        isLoading={unsuspendMutation.isPending}
        onConfirm={() => unsuspendMutation.mutate()}
      />
    </AppShell>
  );
}
