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
  ShieldAlert,
  ShieldCheck,
  User,
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
import { EmptyState } from "@/components/ui/empty-state";
import { ImageViewer } from "@/components/ui/image-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  approveVehicle,
  getAdminVehicleById,
  rejectVehicle,
  suspendVehicle,
} from "@/lib/api/vehicles";
import {
  getVehicleStatusMeta,
  getVerificationStatusMeta,
} from "@/lib/constants";
import {
  formatCurrency,
  formatDateOnly,
} from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

export default function VehicleReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const vehicleId = params?.id as string;

  // Local checklist for visual verification
  const [checklist, setChecklist] = useState({
    photosClear: false,
    regMatchesRc: false,
    rcOwnerMatchesOrNoc: false,
    insuranceValid: false,
    priceReasonable: false,
  });

  // Selected photo index for gallery
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  // Selected document tab: rc | insurance | noc
  const [selectedDocType, setSelectedDocType] = useState<"rc" | "insurance" | "noc">("rc");

  // Preference: Return to queue or stay
  const [returnToQueueOnDecision, setReturnToQueueOnDecision] = useState<boolean>(false);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState<boolean>(false);

  // Fetch vehicle details
  const vehicleQuery = useQuery({
    queryKey: queryKeys.vehicles.detail(vehicleId),
    queryFn: () => getAdminVehicleById(vehicleId),
    enabled: Boolean(vehicleId),
  });

  const vehicle = vehicleQuery.data;
  usePageTitle(
    vehicle
      ? `Review: ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber || "Unregistered"})`
      : "Review Vehicle"
  );

  const handleSuccess = (message: string) => {
    showToast(message, "brand");
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });

    if (returnToQueueOnDecision) {
      router.push("/vehicles");
    }
  };

  // Action mutations
  const approveMutation = useMutation({
    mutationFn: () => approveVehicle(vehicleId),
    onSuccess: () => {
      setApproveDialogOpen(false);
      handleSuccess("Vehicle approved and set to live");
    },
    onError: (err: Error) => showToast(err.message || "Approval failed", "negative"),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectVehicle(vehicleId, { reason }),
    onSuccess: () => {
      setRejectDialogOpen(false);
      handleSuccess("Vehicle rejected");
    },
    onError: (err: Error) => showToast(err.message || "Rejection failed", "negative"),
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => suspendVehicle(vehicleId, { reason }),
    onSuccess: () => {
      setSuspendDialogOpen(false);
      handleSuccess("Vehicle suspended from marketplace");
    },
    onError: (err: Error) => showToast(err.message || "Suspension failed", "negative"),
  });

  // Identity comparison: RC Owner Name vs Account Name
  const identityCheck = useMemo(() => {
    if (!vehicle) return { matches: false, rcName: "", accountName: "" };

    const rcName = vehicle.rc?.ownerName?.trim() || "";
    const accountName = vehicle.publisher?.fullName?.trim() || "";

    if (!rcName || !accountName) {
      return { matches: false, rcName, accountName };
    }

    const matches = rcName.toLowerCase() === accountName.toLowerCase();
    return { matches, rcName, accountName };
  }, [vehicle]);

  // Insurance expiry check
  const insuranceCheck = useMemo(() => {
    if (!vehicle?.insurance?.validUntil) {
      return { status: "missing", text: "No insurance expiry date recorded", tone: "negative" as const };
    }

    const expiryDate = new Date(vehicle.insurance.validUntil);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        status: "expired",
        text: `Expired on ${formatDateOnly(expiryDate)} (${Math.abs(daysRemaining)} days ago)`,
        tone: "negative" as const,
      };
    }

    if (daysRemaining <= 30) {
      return {
        status: "expiring_soon",
        text: `Warning: Expires in ${daysRemaining} days (${formatDateOnly(expiryDate)})`,
        tone: "warning" as const,
      };
    }

    return {
      status: "valid",
      text: `Valid until ${formatDateOnly(expiryDate)} (${daysRemaining} days remaining)`,
      tone: "brand" as const,
    };
  }, [vehicle]);

  if (vehicleQuery.isLoading) {
    return (
      <AppShell title="Review Vehicle">
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

  if (!vehicle) {
    return (
      <AppShell title="Review Vehicle">
        <EmptyState
          title="Vehicle not found"
          description="The requested vehicle could not be loaded or has been deleted."
          action={
            <Link href="/vehicles">
              <Button variant="secondary">Back to Vehicles</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const statusMeta = getVehicleStatusMeta(vehicle.status);
  const publisherProfile = vehicle.publisherProfile;
  const isAgent = publisherProfile?.publisherType === "agent" || vehicle.publisher?.role === "agent";
  const verificationMeta = getVerificationStatusMeta(publisherProfile?.verificationStatus || "pending");
  const flags = publisherProfile?.flags || [];
  const photos = vehicle.images || [];
  const currentPhoto = photos[selectedPhotoIndex] || photos[0];

  // Document URLs
  const rcUrl = vehicle.rc?.file?.url;
  const insuranceUrl = vehicle.insurance?.file?.url;
  const nocUrl = vehicle.noc?.file?.url;

  const activeDocUrl =
    selectedDocType === "rc"
      ? rcUrl
      : selectedDocType === "insurance"
      ? insuranceUrl
      : nocUrl;

  const isPendingReview = vehicle.status === "pending_review";
  const isActive = vehicle.status === "active";

  return (
    <AppShell
      title={`Review: ${vehicle.brand} ${vehicle.model}`}
      contextLine={`Registration: ${vehicle.registrationNumber || "Unregistered"} | ID: ${vehicle._id}`}
    >
      <div className="space-y-6">
        {/* Navigation & Preferences Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Vehicles
          </Link>

          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
            <Checkbox
              checked={returnToQueueOnDecision}
              onChange={(e) => setReturnToQueueOnDecision(e.target.checked)}
            />
            <span>After a decision, return to queue</span>
          </label>
        </div>

        {/* Rejection / Suspension Notice */}
        {vehicle.rejectionReason && (
          <div className="bg-[#FDF0EF] border border-negative/30 rounded p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-negative shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-ink">
                  Reason for Last Decision ({statusMeta.label})
                </h3>
                <p className="text-xs text-ink">{vehicle.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile / Vehicle Flags Alert */}
        {flags.length > 0 && (
          <div className="bg-[#FEF6E9] border border-warning/30 rounded p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-semibold text-ink">
                  Owner Profile Flags ({flags.length})
                </h3>
                {flags.map((flag, idx) => (
                  <p key={idx} className="text-xs text-ink">
                    <strong className="uppercase">{flag.type}:</strong> {flag.note}{" "}
                    <span className="text-ink-soft">({formatDateOnly(flag.createdAt)})</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Facts and Specifications (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Vehicle Specifications */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Vehicle Specifications
                </h2>
                <div className="flex items-center gap-2">
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  <Badge tone="neutral">{vehicle.type === "car" ? "Car" : "Bike"}</Badge>
                </div>
              </div>

              <DefinitionList className="mt-3">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Make & Model</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                    {vehicle.brand} {vehicle.model}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Variant & Year</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {vehicle.variant ? `${vehicle.variant}, ` : ""}Model Year {vehicle.year}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Transmission & Fuel</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 capitalize">
                    {vehicle.transmission} &bull; {vehicle.fuelType}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">
                    {vehicle.type === "car" ? "Seating Capacity" : "Engine Capacity"}
                  </dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {vehicle.type === "car"
                      ? `${vehicle.seats || "Not specified"} seats`
                      : `${vehicle.engineCc || "Not specified"} cc`}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Color</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 capitalize">
                    {vehicle.color || "Not specified"}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Destination</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink sm:col-span-2 sm:mt-0">
                    {vehicle.destination?.name || "Unassigned"} ({vehicle.destination?.state})
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Minimum Rental</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {vehicle.minRentalHours || 4} hours
                  </dd>
                </div>
              </DefinitionList>
            </div>

            {/* Identity & Legal Verification */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                Identity & Legal Match
              </h2>

              <DefinitionList className="mt-3">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Registration Number</dt>
                  <dd className="mt-1 text-sm font-mono font-bold text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                    <span>{vehicle.registrationNumber || "Not recorded"}</span>
                    {vehicle.registrationNumber && (
                      <CopyButton value={vehicle.registrationNumber} label="Copy registration" />
                    )}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Chassis Number</dt>
                  <dd className="mt-1 text-sm font-mono text-ink sm:col-span-2 sm:mt-0 flex items-center gap-2">
                    <span>{vehicle.chassisNumber || "Not recorded"}</span>
                    {vehicle.chassisNumber && (
                      <CopyButton value={vehicle.chassisNumber} label="Copy chassis" />
                    )}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">RC Owner vs Account</dt>
                  <dd className="mt-1 sm:col-span-2 sm:mt-0 space-y-1">
                    <div className="text-xs text-ink flex items-center gap-2 flex-wrap">
                      <span>RC Name: <strong>{identityCheck.rcName || "None"}</strong></span>
                      <span>|</span>
                      <span>Account: <strong>{identityCheck.accountName}</strong></span>
                    </div>

                    {/* Mismatch marked clearly with text, not only colour */}
                    {identityCheck.matches ? (
                      <div className="flex items-center gap-1.5 text-xs text-brand font-medium mt-1">
                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                        <span>Name Match: The RC owner name exactly matches the account owner.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-negative font-medium mt-1">
                        <XCircle className="w-4 h-4 text-negative shrink-0" />
                        <span>
                          Name Mismatch: RC owner does not match the account name. A valid NOC is required.
                        </span>
                      </div>
                    )}
                  </dd>
                </div>
              </DefinitionList>
            </div>

            {/* Insurance Verification */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                Insurance Status
              </h2>

              <DefinitionList className="mt-3">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Policy Number</dt>
                  <dd className="mt-1 text-sm font-mono text-ink sm:col-span-2 sm:mt-0">
                    {vehicle.insurance?.policyNumber || "Not provided"}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Policy Expiry</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">
                        {formatDateOnly(vehicle.insurance?.validUntil)}
                      </span>
                      <Badge tone={insuranceCheck.tone}>
                        {insuranceCheck.status === "valid"
                          ? "Valid"
                          : insuranceCheck.status === "expiring_soon"
                          ? "Expiring Soon"
                          : "Expired / Missing"}
                      </Badge>
                    </div>

                    {/* Plain text warning for expiration */}
                    <p
                      className={`text-xs font-medium ${
                        insuranceCheck.tone === "negative"
                          ? "text-negative"
                          : insuranceCheck.tone === "warning"
                          ? "text-warning"
                          : "text-brand"
                      }`}
                    >
                      {insuranceCheck.text}
                    </p>
                  </dd>
                </div>
              </DefinitionList>
            </div>

            {/* Pricing & Terms */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                Pricing & Cancellation Policy
              </h2>

              <DefinitionList className="mt-3">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Rental Rates</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0 flex items-center gap-4">
                    <span>
                      Daily: <strong>{formatCurrency(vehicle.pricing?.perDay)}</strong>
                    </span>
                    {vehicle.pricing?.perHour ? (
                      <span>
                        Hourly: <strong>{formatCurrency(vehicle.pricing?.perHour)}</strong>
                      </span>
                    ) : null}
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Security Deposit</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    {formatCurrency(vehicle.pricing?.deposit || 0)}{" "}
                    <span className="text-xs text-ink-soft">(Informational, collected by owner)</span>
                  </dd>
                </div>

                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 items-baseline">
                  <dt className="text-xs text-ink-soft font-medium">Free Cancellation</dt>
                  <dd className="mt-1 text-sm text-ink sm:col-span-2 sm:mt-0">
                    Up to{" "}
                    <strong>
                      {vehicle.cancellationPolicy?.freeCancellationHoursBeforePickup || 24} hours
                    </strong>{" "}
                    before pickup time.
                  </dd>
                </div>
              </DefinitionList>
            </div>

            {/* Pickup Location & Handover */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-3 border-b border-line font-display">
                Pickup & Handover Location
              </h2>

              <div className="space-y-4 mt-3">
                <div className="text-xs text-ink space-y-1">
                  <p>
                    <strong>Mode:</strong>{" "}
                    {vehicle.pickup?.mode === "fixed_counter"
                      ? "Fixed Counter Pickup (Rental Agent)"
                      : "Flexible Area Handover (Individual Owner)"}
                  </p>
                  {vehicle.pickup?.address && (
                    <p>
                      <strong>Address:</strong> {vehicle.pickup.address}
                    </p>
                  )}
                  {vehicle.pickup?.landmark && (
                    <p className="text-ink-soft">Landmark: {vehicle.pickup.landmark}</p>
                  )}
                  {vehicle.pickup?.approximateArea && (
                    <p>
                      <strong>Approximate Area:</strong> {vehicle.pickup.approximateArea}
                    </p>
                  )}
                </div>

                {/* OpenStreetMap for fixed counter */}
                {vehicle.pickup?.location?.coordinates && (
                  <OsmMap
                    latitude={vehicle.pickup.location.coordinates[1]}
                    longitude={vehicle.pickup.location.coordinates[0]}
                    label={`${vehicle.brand} ${vehicle.model} Pickup Location`}
                  />
                )}
              </div>
            </div>

            {/* Owner Overview & Link to Owner Review */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Owner Profile
                </h2>
                <Badge tone={verificationMeta.tone}>
                  Owner: {verificationMeta.label}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 text-xs text-ink">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand" />
                    <span className="font-bold text-sm">{vehicle.publisher?.fullName}</span>
                    <Badge tone={isAgent ? "brand" : "neutral"}>
                      {isAgent ? "Agent" : "Individual"}
                    </Badge>
                  </div>
                  <p className="text-ink-soft">{vehicle.publisher?.email} &bull; {vehicle.publisher?.phone}</p>
                  {publisherProfile?.reliability && (
                    <p className="text-ink font-semibold">
                      Reliability Score: {publisherProfile.reliability.score}/100
                    </p>
                  )}
                </div>

                {publisherProfile?._id && (
                  <Link
                    href={`/verifications/${publisherProfile._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline self-start sm:self-auto"
                  >
                    <span>Review Owner Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Photos Gallery, Documents & Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Reviewer Checklist (kept locally) */}
            <div className="bg-surface border border-line rounded p-5">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider pb-2 border-b border-line font-display">
                Review Checklist
              </h2>
              <p className="text-xs text-ink-soft mt-1 mb-3">
                Review aid kept locally on this device.
              </p>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.photosClear}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, photosClear: e.target.checked }))
                    }
                  />
                  <span>Photos are clear and show the same vehicle</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.regMatchesRc}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, regMatchesRc: e.target.checked }))
                    }
                  />
                  <span>Registration number on the RC matches the number entered</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.rcOwnerMatchesOrNoc}
                    onChange={(e) =>
                      setChecklist((prev) => ({
                        ...prev,
                        rcOwnerMatchesOrNoc: e.target.checked,
                      }))
                    }
                  />
                  <span>RC owner matches the owner or a valid NOC is attached</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.insuranceValid}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, insuranceValid: e.target.checked }))
                    }
                  />
                  <span>Insurance is valid and not about to expire</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={checklist.priceReasonable}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, priceReasonable: e.target.checked }))
                    }
                  />
                  <span>Price and rental terms look reasonable</span>
                </label>
              </div>
            </div>

            {/* Vehicle Photos Gallery */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Vehicle Photos ({photos.length})
                </h2>
                <Badge tone={photos.length >= 3 ? "brand" : "warning"}>
                  {photos.length >= 3 ? "Minimum 3 Met" : `${photos.length}/3 Photos`}
                </Badge>
              </div>

              {photos.length === 0 ? (
                <p className="text-xs text-ink-soft py-4">No photos uploaded.</p>
              ) : (
                <div className="space-y-3 mt-3">
                  {currentPhoto && (
                    <ImageViewer
                      src={currentPhoto.url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      caption={`Photo ${selectedPhotoIndex + 1} of ${photos.length}`}
                    />
                  )}

                  {/* Thumbnails row */}
                  {photos.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {photos.map((p, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`h-14 rounded border overflow-hidden transition-all ${
                            selectedPhotoIndex === idx
                              ? "border-brand ring-2 ring-brand/30"
                              : "border-line opacity-70 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legal Documents: RC, Insurance, NOC */}
            <div className="bg-surface border border-line rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-display">
                  Vehicle Documents
                </h2>
              </div>

              {/* Tabs for RC, Insurance, NOC */}
              <div className="flex border-b border-line mt-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSelectedDocType("rc")}
                  className={`pb-2 px-3 border-b-2 transition-colors ${
                    selectedDocType === "rc"
                      ? "border-brand text-brand font-bold"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  Registration (RC)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocType("insurance")}
                  className={`pb-2 px-3 border-b-2 transition-colors ${
                    selectedDocType === "insurance"
                      ? "border-brand text-brand font-bold"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  Insurance Policy
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocType("noc")}
                  className={`pb-2 px-3 border-b-2 transition-colors ${
                    selectedDocType === "noc"
                      ? "border-brand text-brand font-bold"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  NOC Document
                </button>
              </div>

              {/* Document display */}
              <div className="mt-4">
                {activeDocUrl ? (
                  activeDocUrl.toLowerCase().endsWith(".pdf") ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-paper rounded border border-line text-center">
                      <p className="text-xs text-ink-soft mb-2 uppercase font-medium">
                        PDF Document ({selectedDocType.toUpperCase()})
                      </p>
                      <a
                        href={activeDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open PDF in new tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <iframe
                        src={activeDocUrl}
                        title={selectedDocType}
                        className="w-full h-80 mt-3 border border-line rounded"
                      />
                    </div>
                  ) : (
                    <ImageViewer
                      src={activeDocUrl}
                      alt={`${selectedDocType.toUpperCase()} Document`}
                      caption={`${selectedDocType.toUpperCase()} Document`}
                    />
                  )
                ) : (
                  <div className="p-6 text-center bg-paper rounded border border-line text-xs text-ink-soft">
                    <FileText className="w-6 h-6 mx-auto text-ink-soft/40 mb-1" />
                    No {selectedDocType.toUpperCase()} file uploaded by the owner.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <StickyActionBar
          info={
            <span>
              Vehicle status: <strong>{statusMeta.label}</strong>
            </span>
          }
        >
          {/* Suspend is available for live vehicles */}
          {isActive && (
            <Button
              variant="danger"
              onClick={() => setSuspendDialogOpen(true)}
            >
              Suspend vehicle
            </Button>
          )}

          {/* Reject is available for vehicles awaiting review */}
          {isPendingReview && (
            <Button
              variant="danger"
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject
            </Button>
          )}

          {/* Approve is available only for vehicles waiting for review */}
          {isPendingReview && (
            <Button
              variant="primary"
              onClick={() => setApproveDialogOpen(true)}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Approve vehicle
            </Button>
          )}
        </StickyActionBar>

        {/* Dialog 1: Approve Vehicle */}
        <ConfirmDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          title="Approve Vehicle"
          description="Approving will make this vehicle live in destination searches and allow travelers to send rental requests."
          targetName={`${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber || "Unregistered"})`}
          actionLabel="Approve Vehicle"
          actionVariant="primary"
          isLoading={approveMutation.isPending}
          onConfirm={() => approveMutation.mutate()}
        />

        {/* Dialog 2: Reject Vehicle */}
        <ConfirmDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          title="Reject Vehicle"
          description="The owner will see this rejection reason, can fix the documentation or specification problem, and re-submit."
          targetName={`${vehicle.brand} ${vehicle.model}`}
          actionLabel="Reject Vehicle"
          actionVariant="danger"
          requireNote
          noteLabel="Rejection Reason"
          notePlaceholder="RC does not match vehicle details or photos are unreadable..."
          isLoading={rejectMutation.isPending}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
        />

        {/* Dialog 3: Suspend Vehicle */}
        <ConfirmDialog
          open={suspendDialogOpen}
          onOpenChange={setSuspendDialogOpen}
          title="Suspend Vehicle"
          description="The vehicle is hidden from customers and cannot receive new requests."
          targetName={`${vehicle.brand} ${vehicle.model}`}
          actionLabel="Suspend Vehicle"
          actionVariant="danger"
          requireNote
          noteLabel="Suspension Reason"
          notePlaceholder="Owner safety issue, overdue maintenance, or unresolved issue..."
          isLoading={suspendMutation.isPending}
          onConfirm={(reason) => suspendMutation.mutate(reason)}
        />
      </div>
    </AppShell>
  );
}
