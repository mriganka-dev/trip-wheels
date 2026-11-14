"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit,
  FileText,
  MapPin,
  Pause,
  Play,
  Send,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DefinitionList } from "@/components/ui/definition-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  deleteVehicle,
  getVehicle,
  pauseVehicle,
  resumeVehicle,
  submitVehicle,
} from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { getVehicleStatusMeta } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { checkVehicleInsurance } from "@/types/vehicle";
import type { Vehicle } from "@/types/vehicle";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const id = typeof params?.id === "string" ? params.id : "";

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: vehicle,
    isLoading,
    isError,
  } = useQuery<Vehicle>({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => getVehicle(id),
    enabled: Boolean(id),
  });

  // Action mutations
  const pauseMutation = useMutation({
    mutationFn: () => pauseVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.mine() });
      showToast("Vehicle paused. It is now hidden from customer searches.", "neutral");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to pause vehicle.", "negative");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.mine() });
      showToast("Vehicle resumed. It is now live for bookings.", "brand");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to resume vehicle.", "negative");
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submitVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.mine() });
      showToast("Vehicle submitted for review.", "brand");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to submit vehicle.", "negative");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.mine() });
      showToast("Vehicle deleted.", "neutral");
      router.push("/vehicles");
    },
    onError: (err: Error) => {
      setActionError(err.message || "Cannot delete vehicle.");
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Loading vehicle..." subtitle="Fetching specifications and documents">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !vehicle) {
    return (
      <AppShell title="Vehicle not found" subtitle="The requested vehicle could not be loaded">
        <div className="p-8 rounded-md border border-(--line) bg-(--surface) text-center max-w-md mx-auto">
          <p className="text-sm text-(--ink-soft) mb-4">
            This vehicle may have been removed or does not belong to your account.
          </p>
          <Link href="/vehicles">
            <Button variant="secondary" size="md">
              Back to vehicles
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const statusMeta = getVehicleStatusMeta(vehicle.status);
  const insuranceInfo = checkVehicleInsurance(vehicle.insurance?.expiresAt);
  const destinationName =
    typeof vehicle.destination === "object" ? vehicle.destination?.name : "Goa";
  const images = vehicle.images || [];

  const isDraft = vehicle.status === "draft";
  const isPending = vehicle.status === "pending_review";
  const isActive = vehicle.status === "active";
  const isPaused = vehicle.status === "paused";
  const isRejected = vehicle.status === "rejected";

  return (
    <AppShell
      title={`${vehicle.brand} ${vehicle.model}`}
      subtitle={`${vehicle.year} • ${vehicle.type} • ${destinationName}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/vehicles">
            <Button variant="quiet" size="md">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              All vehicles
            </Button>
          </Link>
          <Link href={`/vehicles/${id}/edit`}>
            <Button variant="secondary" size="md">
              <Edit className="w-4 h-4 mr-1.5" />
              Edit vehicle
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Status explanation banner */}
        <div className="p-4 rounded-md border border-(--line) bg-(--surface) flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            </div>
            <div>
              <p className="text-xs text-(--ink) font-medium">
                {isDraft &&
                  "This vehicle is a draft. Complete all sections and send it for review."}
                {isPending && "Our team is reviewing this vehicle."}
                {isActive &&
                  "This vehicle is live and visible to customers in search results."}
                {isPaused && "This vehicle is paused. Customers cannot book it."}
                {isRejected && "This vehicle was not approved by our review team."}
                {vehicle.status === "suspended" &&
                  "This vehicle is suspended by administrators."}
              </p>
              {isRejected && vehicle.rejectionReason && (
                <p className="text-xs text-(--negative) font-semibold mt-1">
                  Reason: {vehicle.rejectionReason}
                </p>
              )}
            </div>
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(isDraft || isRejected) && (
              <Button
                variant="primary"
                size="sm"
                isLoading={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send for review
              </Button>
            )}

            {isActive && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate()}
              >
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                Pause vehicle
              </Button>
            )}

            {isPaused && (
              <Button
                variant="primary"
                size="sm"
                isLoading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate()}
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Resume vehicle
              </Button>
            )}
          </div>
        </div>

        {/* Insurance warning banner */}
        {insuranceInfo.status !== "valid" && (
          <div
            role="alert"
            className={`p-4 rounded-md border flex items-start justify-between gap-3 ${
              insuranceInfo.tone === "negative"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {insuranceInfo.status === "expired"
                    ? "Insurance policy expired"
                    : "Insurance expiring soon"}
                </span>
                <span>{insuranceInfo.message}</span>
              </div>
            </div>

            <Link href={`/vehicles/${id}/edit`}>
              <Button variant="secondary" size="sm" className="shrink-0 text-xs">
                Upload new insurance
              </Button>
            </Link>
          </div>
        )}

        {/* Photos Gallery */}
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display text-(--ink)">
              Vehicle photos ({images.length})
            </h2>
            <Link
              href={`/vehicles/${id}/edit`}
              className="text-xs font-semibold text-(--brand) hover:underline"
            >
              Manage photos
            </Link>
          </div>

          {images.length === 0 ? (
            <div className="p-6 text-center rounded border border-dashed border-(--line) bg-(--paper) text-xs text-(--ink-soft)">
              No photos uploaded yet. Add at least 3 photos before review.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img._id || img.publicId}
                  className="relative aspect-4/3 rounded overflow-hidden border border-(--line) bg-(--paper)"
                >
                  <Image
                    src={img.url}
                    alt={`${vehicle.brand} ${vehicle.model} photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-(--brand) text-white px-1.5 py-0.5 rounded shadow-xs">
                      Main photo
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Specifications & Terms Definition Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle Specifications */}
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <h2 className="text-sm font-bold font-display text-(--ink)">
              Vehicle specifications
            </h2>
            <DefinitionList
              items={[
                { key: "type", label: "Type", value: <span className="capitalize">{vehicle.type}</span> },
                { key: "brand", label: "Brand", value: vehicle.brand },
                { key: "model", label: "Model", value: vehicle.model },
                { key: "variant", label: "Variant", value: vehicle.variant || "Standard" },
                { key: "year", label: "Year", value: vehicle.year },
                { key: "color", label: "Color", value: vehicle.color || "Standard" },
                { key: "transmission", label: "Transmission", value: <span className="capitalize">{vehicle.transmission}</span> },
                { key: "fuel", label: "Fuel type", value: <span className="capitalize">{vehicle.fuelType}</span> },
                vehicle.type === "car"
                  ? { key: "seats", label: "Seats", value: `${vehicle.seats || "Not specified"} seats` }
                  : { key: "engine", label: "Engine capacity", value: `${vehicle.engineCc || "Not specified"} cc` },
                { key: "mileage", label: "Efficiency", value: vehicle.mileage || "Not specified" },
                { key: "dest", label: "Destination", value: destinationName },
              ]}
            />
          </section>

          {/* Pricing & Terms */}
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <h2 className="text-sm font-bold font-display text-(--ink)">
              Pricing and cancellation
            </h2>
            <DefinitionList
              items={[
                {
                  key: "perDay",
                  label: "Price per day",
                  value: <strong className="font-bold">{formatCurrency(vehicle.pricing?.perDay || 0)}</strong>,
                },
                {
                  key: "perHour",
                  label: "Price per hour",
                  value: vehicle.pricing?.perHour ? formatCurrency(vehicle.pricing.perHour) : "Not configured",
                },
                {
                  key: "deposit",
                  label: "Security deposit",
                  value: (
                    <div>
                      <span>{formatCurrency(vehicle.pricing?.deposit || 0)}</span>
                      <p className="text-[11px] text-(--ink-soft) font-normal mt-0.5">
                        Collected directly from customer
                      </p>
                    </div>
                  ),
                },
                {
                  key: "minHours",
                  label: "Min rental hours",
                  value: `${vehicle.minRentalHours || 4} hours`,
                },
                {
                  key: "freeCancel",
                  label: "Free cancellation",
                  value: `${vehicle.cancellationPolicy?.freeCancellationHoursBeforePickup ?? 24} hours before pickup`,
                },
                {
                  key: "cancelNotes",
                  label: "Policy notes",
                  value: vehicle.cancellationPolicy?.notes || "Standard cancellation rules apply",
                },
              ]}
            />
          </section>
        </div>

        {/* Pickup & Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pickup Location */}
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-(--brand)" />
              <h2 className="text-sm font-bold font-display text-(--ink)">
                Pickup location
              </h2>
            </div>
            <div className="text-xs text-(--ink) space-y-2">
              <p>
                <strong className="text-(--ink-soft) uppercase block text-[10px]">Mode:</strong>
                <span className="capitalize">{vehicle.pickup?.mode || "Fixed"}</span>
              </p>
              {vehicle.pickup?.address && (
                <p>
                  <strong className="text-(--ink-soft) uppercase block text-[10px]">Address:</strong>
                  {vehicle.pickup.address}
                </p>
              )}
              {vehicle.pickup?.landmark && (
                <p>
                  <strong className="text-(--ink-soft) uppercase block text-[10px]">Landmark:</strong>
                  {vehicle.pickup.landmark}
                </p>
              )}
              {vehicle.pickup?.location?.coordinates && (
                <p className="font-mono text-[11px] text-(--ink-soft)">
                  Pin: Lat {vehicle.pickup.location.coordinates[1].toFixed(5)}, Lng{" "}
                  {vehicle.pickup.location.coordinates[0].toFixed(5)}
                </p>
              )}
              {vehicle.pickup?.approximateArea && (
                <p>
                  <strong className="text-(--ink-soft) uppercase block text-[10px]">Approximate area:</strong>
                  {vehicle.pickup.approximateArea}
                </p>
              )}
            </div>
          </section>

          {/* Documents & Registration */}
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-(--brand)" />
              <h2 className="text-sm font-bold font-display text-(--ink)">
                Registration and documents
              </h2>
            </div>
            <DefinitionList
              items={[
                {
                  key: "regNumber",
                  label: "Registration number",
                  value: (
                    <span className="font-mono uppercase font-bold">
                      {vehicle.registrationNumber || vehicle.rc?.registrationNumber || "Pending"}
                    </span>
                  ),
                },
                {
                  key: "chassisNumber",
                  label: "Chassis number",
                  value: (
                    <span className="font-mono uppercase">
                      {vehicle.chassisNumber || "Pending"}
                    </span>
                  ),
                },
                {
                  key: "rcDoc",
                  label: "RC document",
                  value: vehicle.rc?.file?.url ? (
                    <span className="inline-flex items-center gap-1 text-xs text-(--brand) font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded ({vehicle.rc?.ownerName || "Owner on file"})
                    </span>
                  ) : (
                    <span className="text-xs text-(--negative)">Not uploaded</span>
                  ),
                },
                {
                  key: "insDoc",
                  label: "Insurance",
                  value: vehicle.insurance?.file?.url ? (
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-1 text-(--brand) font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Uploaded ({vehicle.insurance.policyNumber || "Policy on file"})
                      </span>
                      {vehicle.insurance.expiresAt && (
                        <p className="text-(--ink-soft) text-[11px] mt-0.5">
                          Expires: {formatDate(vehicle.insurance.expiresAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-(--negative)">Not uploaded</span>
                  ),
                },
                {
                  key: "nocDoc",
                  label: "NOC document",
                  value: vehicle.noc?.file?.url ? (
                    <span className="inline-flex items-center gap-1 text-xs text-(--brand) font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="text-xs text-(--ink-soft)">Not required</span>
                  ),
                },
              ]}
            />
          </section>
        </div>

        {/* Availability Calendar Link (Plan 5 preview) */}
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-(--brand) shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold font-display text-(--ink)">
                Availability and calendar
              </h3>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                Block maintenance dates or see upcoming bookings for this vehicle.
              </p>
            </div>
          </div>
          <Link href="/schedule">
            <Button variant="secondary" size="sm">
              Open schedule
            </Button>
          </Link>
        </section>

        {/* Delete Vehicle Danger Action */}
        <div className="pt-6 border-t border-(--line) flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setActionError(null);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete vehicle
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogContent title="Delete this vehicle?">
            <div className="flex flex-col gap-4 text-xs text-(--ink) pt-2">
              {actionError && (
                <div
                  role="alert"
                  className="p-3 rounded bg-red-50 border border-red-200 text-(--negative) flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="leading-relaxed">
                Are you sure you want to delete{" "}
                <strong>
                  {vehicle.brand} {vehicle.model}
                </strong>
                ? This action permanently removes the vehicle listing.
              </p>

              <div className="p-3 rounded bg-(--paper) border border-(--line) text-(--ink-soft)">
                <p className="font-semibold text-(--ink)">Active booking policy:</p>
                <p className="mt-1">
                  Vehicles with active or confirmed bookings cannot be deleted until
                  all trips are completed or resolved.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  Confirm delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
