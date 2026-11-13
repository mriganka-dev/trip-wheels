"use client";

import React, { useState, useId, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseISO, differenceInHours } from "date-fns";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getVehicleDetail } from "@/lib/api/vehicles";
import { createBooking } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency, formatDateTime, formatDurationHours } from "@/lib/format";
import { ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";

interface BookPageProps {
  params: Promise<{ vehicleId: string }>;
}

function BookFormContent({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = useId();

  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";

  const [customerNote, setCustomerNote] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [idempotencyKey] = useState(() => `book-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const {
    data: vehicle,
    isLoading: isLoadingVehicle,
    isError: isVehicleError,
  } = useQuery<Vehicle>({
    queryKey: queryKeys.vehicles.detail(vehicleId),
    queryFn: () => getVehicleDetail(vehicleId),
    staleTime: 5 * 60 * 1000,
  });

  const hasDates = Boolean(fromParam && toParam);
  let durationHours = 0;
  let estimatedTotal = 0;

  if (hasDates && vehicle) {
    try {
      const fromDate = parseISO(fromParam);
      const toDate = parseISO(toParam);
      durationHours = differenceInHours(toDate, fromDate);

      if (durationHours >= 24) {
        const days = Math.floor(durationHours / 24);
        const remHours = durationHours % 24;
        const hourlyRate = vehicle.pricing.perHour || Math.round(vehicle.pricing.perDay / 12);
        estimatedTotal = days * vehicle.pricing.perDay + remHours * hourlyRate;
      } else {
        const hourlyRate = vehicle.pricing.perHour || Math.round(vehicle.pricing.perDay / 12);
        estimatedTotal = durationHours * hourlyRate;
      }
    } catch {
      durationHours = 0;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsConflict(false);
    setIsUnverified(false);

    if (!hasDates) {
      setErrorMessage("Missing pickup or return dates. Please choose dates on the vehicle page.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("Please confirm you understand document requirements and direct pickup payment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newBooking = await createBooking(
        {
          vehicleId,
          startAt: new Date(fromParam).toISOString(),
          endAt: new Date(toParam).toISOString(),
          customerNote: customerNote.trim() || undefined,
        },
        idempotencyKey
      );

      router.push(`/bookings/${newBooking._id}?requested=true`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setIsConflict(true);
          setErrorMessage("These dates are no longer available for this vehicle. Another traveler may have just booked it.");
        } else if (err.statusCode === 403 && err.message.toLowerCase().includes("email")) {
          setIsUnverified(true);
          setErrorMessage("Your email address must be verified before submitting booking requests.");
        } else if (err.statusCode === 400 && err.message.toLowerCase().includes("active requests")) {
          setErrorMessage("You have reached the maximum allowed active requests. Please wait for your pending requests to be accepted or cancelled.");
        } else {
          setErrorMessage(err.message || "Failed to create booking request. Please try again.");
        }
      } else {
        setErrorMessage("Network error. Your note has been preserved. Please try submitting again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingVehicle) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isVehicleError || !vehicle) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState
          title="Vehicle not found"
          message="The requested vehicle could not be loaded."
          onRetry={() => router.back()}
        />
      </div>
    );
  }

  const primaryImage =
    vehicle.images?.find((img) => img.isPrimary) || vehicle.images?.[0];

  const destinationName =
    typeof vehicle.destination === "object"
      ? vehicle.destination.name
      : "Destination";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/vehicles/${vehicle._id}?from=${encodeURIComponent(
            fromParam
          )}&to=${encodeURIComponent(toParam)}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--ink-soft) hover:text-(--ink)"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to vehicle details</span>
        </Link>
      </div>

      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
          Step 1 of 2
        </span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-display text-(--ink)">
          Review and request booking
        </h1>
        <p className="mt-1 text-xs text-(--ink-soft)">
          Verify your rental schedule. You pay the owner directly when you collect the vehicle.
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-(--negative) space-y-2"
        >
          <p className="font-semibold">{errorMessage}</p>
          {isConflict && (
            <div>
              <Link
                href={`/search?destination=${
                  typeof vehicle.destination === "object"
                    ? vehicle.destination.slug
                    : ""
                }&from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(
                  toParam
                )}`}
                className="underline underline-offset-2 font-medium"
              >
                Search alternative vehicles for these dates
              </Link>
            </div>
          )}
          {isUnverified && (
            <div>
              <Link
                href="/verify-email"
                className="underline underline-offset-2 font-medium"
              >
                Go to email verification
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Vehicle Summary Card */}
      <div className="rounded-md border border-(--line) bg-(--surface) p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-36 h-28 rounded-md bg-(--paper) border border-(--line) overflow-hidden relative shrink-0">
            {primaryImage?.url ? (
              <Image
                src={primaryImage.url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : (
              <div className="p-3 text-center text-xs font-display text-(--ink-soft)">
                {vehicle.brand} {vehicle.model}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs uppercase font-semibold text-(--ink-soft)">
              {vehicle.type} in {destinationName}
            </span>
            <h2 className="font-display text-lg font-bold text-(--ink)">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </h2>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-(--ink-soft)">
              <ShieldCheck className="w-3.5 h-3.5 text-(--brand)" />
              <span>Owner: {vehicle.publisher?.fullName || "Verified Publisher"}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-(--ink-soft)">
              <span>{vehicle.transmission.toUpperCase()}</span>
              <span>&bull;</span>
              <span>{vehicle.fuelType.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Duration breakdown */}
        <div className="mt-6 pt-5 border-t border-(--line) grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-md bg-(--paper) border border-(--line)">
            <span className="text-(--ink-soft) block mb-1">Pickup</span>
            <span className="font-semibold text-(--ink)">
              {fromParam ? formatDateTime(fromParam) : "Date missing"}
            </span>
          </div>

          <div className="p-3 rounded-md bg-(--paper) border border-(--line)">
            <span className="text-(--ink-soft) block mb-1">Return</span>
            <span className="font-semibold text-(--ink)">
              {toParam ? formatDateTime(toParam) : "Date missing"}
            </span>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="mt-4 p-4 rounded-md bg-(--paper) border border-(--line) flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-(--ink-soft) block">
              Estimated duration: {formatDurationHours(durationHours)}
            </span>
            <span className="font-display font-bold text-base text-(--brand)">
              Estimated total: {formatCurrency(estimatedTotal)}
            </span>
          </div>
          <span className="text-[11px] text-(--ink-soft) sm:text-right max-w-xs">
            Estimate only. Pay directly to the owner at vehicle handover.
          </span>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md border border-(--line) bg-(--surface) p-5 sm:p-6 space-y-4">
          <Field
            label="Note for the owner (optional)"
            htmlFor="customerNote"
            hint="Up to 300 characters. State your arrival flight or train details."
          >
            <Textarea
              id="customerNote"
              rows={3}
              maxLength={300}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Arriving on Digha Express at 11:30 am. Will carry two small backpacks."
            />
            <div className="text-[11px] text-right text-(--ink-soft)">
              {customerNote.length} / 300
            </div>
          </Field>

          {/* Mandatory Checkbox */}
          <div className="pt-2">
            <Checkbox
              id={`${formId}-terms`}
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              label="I understand that I pay the owner directly at pickup and that I must carry a valid physical government ID and driving license."
            />
          </div>
        </div>

        {/* Next step notice */}
        <div className="rounded-md border border-(--line) bg-(--surface) p-4 flex items-start gap-3 text-xs text-(--ink-soft)">
          <Clock className="w-4 h-4 text-(--brand) shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            The owner has about 6 hours to accept. We will notify you by email and notification. You will see other options if the owner cannot take your request.
          </p>
        </div>

        {/* Submit button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!hasDates || !agreedToTerms || isSubmitting}
          >
            Send booking request
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function BookVehiclePage({ params }: BookPageProps) {
  const { vehicleId } = use(params);

  return (
    <main className="py-8 sm:py-12 bg-(--paper) min-h-screen">
      <Container size="narrow">
        <Suspense
          fallback={
            <div className="max-w-2xl mx-auto space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-44 w-full" />
            </div>
          }
        >
          <BookFormContent vehicleId={vehicleId} />
        </Suspense>
      </Container>
    </main>
  );
}
