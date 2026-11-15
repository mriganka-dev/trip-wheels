"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RadioGroup } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/toast";
import { PhotoManager } from "./photo-manager";
import { DocumentUploader } from "./document-uploader";
import { getActiveDestinations } from "@/lib/api/destinations";
import {
  createVehicle,
  submitVehicle,
  updateVehicle,
} from "@/lib/api/vehicles";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import {
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_TYPES,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { User, PublisherProfile } from "@/types/auth";
import type { Destination } from "@/types/destination";
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  Vehicle,
} from "@/types/vehicle";

const basicsSchema = z.object({
  destination: z.string().min(1, "Please select a destination"),
  type: z.enum(["bike", "car"], {
    message: "Vehicle type is required",
  }),
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().optional(),
  year: z
    .number()
    .int()
    .min(1990, "Year must be 1990 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().trim().optional(),
  transmission: z.enum(["manual", "automatic"]),
  fuelType: z.enum(["petrol", "diesel", "electric", "cng"]),
  seats: z.number().int().min(1).max(12).optional().nullable(),
  engineCc: z.number().int().min(50).max(5000).optional().nullable(),
  mileage: z.string().trim().optional(),
});

const pricingSchema = z.object({
  perDay: z.number().min(1, "Per-day price must be at least ₹1"),
  perHour: z.number().min(0).optional().nullable(),
  deposit: z.number().min(0),
  minRentalHours: z.number().int().min(1),
  freeCancellationHoursBeforePickup: z.number().int().min(0),
  cancellationNotes: z.string().trim().optional(),
});

type BasicsFormData = z.infer<typeof basicsSchema>;
type PricingFormData = z.infer<typeof pricingSchema>;

const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Pricing" },
  { id: 3, label: "Pickup" },
  { id: 4, label: "Photos" },
  { id: 5, label: "Documents" },
  { id: 6, label: "Review" },
];

interface VehicleFormProps {
  mode: "create" | "edit";
  initialVehicle?: Vehicle;
  user: User | null;
  profile: PublisherProfile | null;
}

export function VehicleForm({
  mode,
  initialVehicle,
  user,
  profile,
}: VehicleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const isEdit = mode === "edit";
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(initialVehicle);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);

  const isLive = vehicle?.status === "active";
  const isAgent = user?.role === "agent";

  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: queryKeys.destinations.list,
    queryFn: getActiveDestinations,
  });

  // Basics Form Hook
  const {
    register: registerBasics,
    handleSubmit: handleSubmitBasics,
    control: controlBasics,
    setValue: setValueBasics,
    formState: { errors: basicsErrors, isSubmitting: isSavingBasics },
  } = useForm<BasicsFormData>({
    resolver: zodResolver(basicsSchema),
    values: {
      destination:
        typeof vehicle?.destination === "object"
          ? vehicle.destination._id
          : vehicle?.destination || profile?.destination || "",
      type: vehicle?.type || "bike",
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      variant: vehicle?.variant || "",
      year: vehicle?.year || new Date().getFullYear(),
      color: vehicle?.color || "",
      transmission: vehicle?.transmission || "manual",
      fuelType: vehicle?.fuelType || "petrol",
      seats: vehicle?.seats || null,
      engineCc: vehicle?.engineCc || null,
      mileage: vehicle?.mileage || "",
    },
  });

  const selectedVehicleType = useWatch({
    control: controlBasics,
    name: "type",
  });
  const selectedTransmission = useWatch({
    control: controlBasics,
    name: "transmission",
  });
  const selectedFuelType = useWatch({
    control: controlBasics,
    name: "fuelType",
  });

  // Pricing Form Hook
  const {
    register: registerPricing,
    handleSubmit: handleSubmitPricing,
    formState: { errors: pricingErrors, isSubmitting: isSavingPricing },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    values: {
      perDay: vehicle?.pricing?.perDay || 0,
      perHour: vehicle?.pricing?.perHour || null,
      deposit: vehicle?.pricing?.deposit || 0,
      minRentalHours: vehicle?.minRentalHours || 4,
      freeCancellationHoursBeforePickup:
        vehicle?.cancellationPolicy?.freeCancellationHoursBeforePickup || 24,
      cancellationNotes: vehicle?.cancellationPolicy?.notes || "",
    },
  });

  // Save Step 1: Basics
  const onSaveBasics = async (data: BasicsFormData) => {
    try {
      if (!vehicle) {
        // Create new vehicle draft
        const payload: CreateVehiclePayload = {
          destination: data.destination,
          type: data.type,
          brand: data.brand,
          model: data.model,
          variant: data.variant || "",
          year: data.year,
          color: data.color || "",
          transmission: data.transmission,
          fuelType: data.fuelType,
          seats: data.type === "car" ? data.seats : null,
          engineCc: data.type === "bike" ? data.engineCc : null,
          mileage: data.mileage || "",
          pricing: {
            perDay: 1000, // placeholder until step 2
            perHour: null,
            deposit: 0,
          },
          minRentalHours: 4,
        };

        const created = await createVehicle(payload);
        setVehicle(created);
        showToast("Vehicle draft created.", "brand");
        setCurrentStep(2);
      } else {
        // Update existing vehicle
        const payload: UpdateVehiclePayload = {
          type: data.type,
          brand: data.brand,
          model: data.model,
          variant: data.variant || "",
          year: data.year,
          color: data.color || "",
          transmission: data.transmission,
          fuelType: data.fuelType,
          seats: data.type === "car" ? data.seats : null,
          engineCc: data.type === "bike" ? data.engineCc : null,
          mileage: data.mileage || "",
        };

        const updated = await updateVehicle(vehicle._id, payload);
        setVehicle(updated);
        showToast("Basic details saved.", "brand");
        setCurrentStep(2);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save basic details.";
      showToast(message, "negative");
    }
  };

  // Save Step 2: Pricing
  const onSavePricing = async (data: PricingFormData) => {
    if (!vehicle) return;

    try {
      const payload: UpdateVehiclePayload = {
        pricing: {
          perDay: data.perDay,
          perHour: data.perHour || null,
          deposit: data.deposit || 0,
        },
        minRentalHours: data.minRentalHours,
        cancellationPolicy: {
          freeCancellationHoursBeforePickup:
            data.freeCancellationHoursBeforePickup,
          notes: data.cancellationNotes || "",
        },
      };

      const updated = await updateVehicle(vehicle._id, payload);
      setVehicle(updated);
      showToast("Pricing and cancellation terms saved.", "brand");
      setCurrentStep(3);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save pricing.";
      showToast(message, "negative");
    }
  };

  // Submit Vehicle for Review
  const handleSubmitForReview = async () => {
    if (!vehicle) return;

    setSubmitReviewError(null);
    setIsSubmittingReview(true);
    try {
      const updated = await submitVehicle(vehicle._id);
      setVehicle(updated);
      showToast("Vehicle submitted for review.", "brand");
      router.push(`/vehicles/${vehicle._id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitReviewError(err.message);
      } else {
        setSubmitReviewError(
          "Failed to submit vehicle. Please ensure all required photos and documents are uploaded."
        );
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Completeness check for review
  const photoCount = vehicle?.images?.length || 0;
  const hasMinPhotos = photoCount >= 3;
  const hasRc = Boolean(vehicle?.rc?.file?.url);
  const hasInsurance = Boolean(vehicle?.insurance?.file?.url);
  const hasRegNumber = Boolean(
    vehicle?.registrationNumber || vehicle?.rc?.registrationNumber
  );
  const hasChassis = Boolean(vehicle?.chassisNumber);
  const isReadyForReview =
    hasMinPhotos && hasRc && hasInsurance && hasRegNumber && hasChassis;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Live Vehicle Warning Banner */}
      {isLive && (
        <div
          role="alert"
          className="p-4 rounded-md border border-amber-300 bg-amber-50 text-xs text-amber-900 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block text-sm mb-0.5">
              Editing live vehicle
            </span>
            Changing these details sends this vehicle for review again and hides
            it from customers until it is approved.
          </div>
        </div>
      )}

      {/* Steps Navigation Bar */}
      <div className="bg-(--surface) border border-(--line) rounded-md p-3 overflow-x-auto">
        <nav aria-label="Vehicle form progress" className="flex items-center min-w-max gap-2">
          {STEPS.map((step) => {
            const isCompleted = vehicle && step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isAccessible = Boolean(vehicle || step.id === 1);

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isAccessible}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-(--brand) text-white"
                    : isCompleted
                    ? "text-(--brand) hover:bg-(--brand-tint)/20"
                    : "text-(--ink-soft) hover:text-(--ink)"
                } ${!isAccessible ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? "bg-white text-(--brand)"
                      : isCompleted
                      ? "bg-(--brand-tint) text-(--brand)"
                      : "bg-(--paper) text-(--ink-soft) border border-(--line)"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    step.id
                  )}
                </span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Step 1: Basics */}
      {currentStep === 1 && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold font-display text-(--ink)">
              Basic vehicle information
            </h2>
            <p className="text-xs text-(--ink-soft) mt-1">
              Select type, make, model and operational specifications.
            </p>
          </div>

          <form
            onSubmit={handleSubmitBasics(onSaveBasics)}
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Destination location *"
                error={basicsErrors.destination?.message}
                hint="City or region where this vehicle operates."
              >
                <Select
                  {...registerBasics("destination")}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select destination
                  </option>
                  {destinations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}{d.state ? `, ${d.state}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Vehicle type *"
                error={basicsErrors.type?.message}
              >
                <RadioGroup
                  name="type"
                  options={VEHICLE_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                  value={selectedVehicleType}
                  onChange={(val) =>
                    setValueBasics("type", val as "bike" | "car", {
                      shouldValidate: true,
                    })
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Brand *"
                error={basicsErrors.brand?.message}
              >
                <Input
                  {...registerBasics("brand")}
                  placeholder={
                    selectedVehicleType === "bike" ? "Royal Enfield" : "Hyundai"
                  }
                />
              </Field>

              <Field
                label="Model *"
                error={basicsErrors.model?.message}
              >
                <Input
                  {...registerBasics("model")}
                  placeholder={
                    selectedVehicleType === "bike" ? "Classic 350" : "Creta"
                  }
                />
              </Field>

              <Field
                label="Variant"
                error={basicsErrors.variant?.message}
                hint="Optional trim or edition."
              >
                <Input
                  {...registerBasics("variant")}
                  placeholder="Dual Channel ABS"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Manufacturing year *"
                error={basicsErrors.year?.message}
              >
                <Input
                  type="number"
                  {...registerBasics("year", { valueAsNumber: true })}
                  placeholder="2023"
                />
              </Field>

              <Field
                label="Color"
                error={basicsErrors.color?.message}
              >
                <Input
                  {...registerBasics("color")}
                  placeholder="Stealth Black"
                />
              </Field>

              <Field
                label="Mileage / efficiency"
                error={basicsErrors.mileage?.message}
                hint="Approximate km per litre."
              >
                <Input
                  {...registerBasics("mileage")}
                  placeholder="35 kmpl"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Transmission *"
                error={basicsErrors.transmission?.message}
              >
                <RadioGroup
                  name="transmission"
                  options={TRANSMISSION_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                  value={selectedTransmission}
                  onChange={(val) =>
                    setValueBasics(
                      "transmission",
                      val as "manual" | "automatic",
                      { shouldValidate: true }
                    )
                  }
                />
              </Field>

              <Field
                label="Fuel type *"
                error={basicsErrors.fuelType?.message}
              >
                <RadioGroup
                  name="fuelType"
                  options={FUEL_TYPES.map((f) => ({
                    value: f.value,
                    label: f.label,
                  }))}
                  value={selectedFuelType}
                  onChange={(val) =>
                    setValueBasics(
                      "fuelType",
                      val as "petrol" | "diesel" | "electric" | "cng",
                      { shouldValidate: true }
                    )
                  }
                />
              </Field>
            </div>

            {selectedVehicleType === "car" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Seating capacity *"
                  error={basicsErrors.seats?.message}
                  hint="Number of seats including driver."
                >
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    {...registerBasics("seats", { valueAsNumber: true })}
                    placeholder="5"
                  />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Engine size (cc) *"
                  error={basicsErrors.engineCc?.message}
                  hint="Engine capacity in cubic centimetres."
                >
                  <Input
                    type="number"
                    min={50}
                    max={5000}
                    {...registerBasics("engineCc", { valueAsNumber: true })}
                    placeholder="350"
                  />
                </Field>
              </div>
            )}

            <div className="pt-4 border-t border-(--line) flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingBasics}
              >
                {isEdit ? "Update and continue to pricing" : "Save and continue to pricing"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Step 2: Pricing */}
      {currentStep === 2 && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold font-display text-(--ink)">
              Pricing and cancellation policy
            </h2>
            <p className="text-xs text-(--ink-soft) mt-1">
              Set your rental rates and cancellation rules for this vehicle.
            </p>
          </div>

          <form
            onSubmit={handleSubmitPricing(onSavePricing)}
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Price per day (₹) *"
                error={pricingErrors.perDay?.message}
                hint="Standard 24-hour rental price in INR."
              >
                <Input
                  type="number"
                  min={1}
                  {...registerPricing("perDay", { valueAsNumber: true })}
                  placeholder="1200"
                />
              </Field>

              <Field
                label="Price per hour (₹)"
                error={pricingErrors.perHour?.message}
                hint="Optional hourly rate for shorter trips."
              >
                <Input
                  type="number"
                  min={0}
                  {...registerPricing("perHour", { valueAsNumber: true })}
                  placeholder="100"
                />
              </Field>

              <Field
                label="Security deposit (₹)"
                error={pricingErrors.deposit?.message}
                hint="You collect any deposit directly from the customer."
              >
                <Input
                  type="number"
                  min={0}
                  {...registerPricing("deposit", { valueAsNumber: true })}
                  placeholder="2000"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Minimum rental hours *"
                error={pricingErrors.minRentalHours?.message}
                hint="Shortest booking duration allowed."
              >
                <Input
                  type="number"
                  min={1}
                  {...registerPricing("minRentalHours", { valueAsNumber: true })}
                  placeholder="4"
                />
              </Field>

              <Field
                label="Free cancellation lead time (hours) *"
                error={
                  pricingErrors.freeCancellationHoursBeforePickup?.message
                }
                hint="Hours before pickup when customer can cancel for free."
              >
                <Input
                  type="number"
                  min={0}
                  {...registerPricing("freeCancellationHoursBeforePickup", {
                    valueAsNumber: true,
                  })}
                  placeholder="24"
                />
              </Field>
            </div>

            <Field
              label="Cancellation policy notes"
              error={pricingErrors.cancellationNotes?.message}
              hint="Additional terms or instructions shown to customers."
            >
              <Input
                {...registerPricing("cancellationNotes")}
                placeholder="Example: Full refund up to 24 hours before pickup. No refund for no-shows."
              />
            </Field>

            <div className="pt-4 border-t border-(--line) flex items-center justify-between">
              <Button
                type="button"
                variant="quiet"
                size="md"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to basics
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingPricing}
              >
                Save and continue to pickup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Step 3: Pickup Location */}
      {currentStep === 3 && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold font-display text-(--ink)">
              Vehicle pickup location
            </h2>
            <p className="text-xs text-(--ink-soft) mt-1">
              {isAgent
                ? "This vehicle uses your business pickup location set in your profile."
                : "This vehicle uses your operational area set in your profile."}
            </p>
          </div>

          <div className="p-4 rounded-md border border-(--line) bg-(--paper) flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-(--ink)">
              <MapPin className="w-4 h-4 text-(--brand)" />
              <span>
                {isAgent ? "Fixed pickup point" : "Approximate pickup area"}
              </span>
            </div>

            {isAgent ? (
              <div className="text-xs text-(--ink) space-y-1">
                <p>
                  <strong className="text-(--ink-soft) uppercase">Address: </strong>
                  {profile?.agentPickup?.address || "Not configured yet"}
                </p>
                {profile?.agentPickup?.landmark && (
                  <p>
                    <strong className="text-(--ink-soft) uppercase">Landmark: </strong>
                    {profile.agentPickup.landmark}
                  </p>
                )}
                {profile?.agentPickup?.location?.coordinates && (
                  <p className="font-mono text-[11px] text-(--ink-soft)">
                    Pin: Lat {profile.agentPickup.location.coordinates[1].toFixed(5)}, Lng{" "}
                    {profile.agentPickup.location.coordinates[0].toFixed(5)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-(--ink) space-y-1">
                <p>
                  <strong className="text-(--ink-soft) uppercase">Area: </strong>
                  {profile?.individualArea?.area
                    ? `${profile.individualArea.area}, ${profile.individualArea.city}`
                    : "Not configured yet"}
                </p>
                <p className="text-(--ink-soft) leading-relaxed">
                  Customers see only the area. You agree the exact pickup point
                  with each customer after you accept.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/verification/profile"
                className="text-xs font-semibold text-(--brand) hover:underline"
              >
                Edit pickup location in your profile
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-(--line) flex items-center justify-between">
            <Button
              type="button"
              variant="quiet"
              size="md"
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to pricing
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(4)}
            >
              Continue to photos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 4: Photos */}
      {currentStep === 4 && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold font-display text-(--ink)">
              Vehicle photos
            </h2>
            <p className="text-xs text-(--ink-soft) mt-1">
              Upload between 3 and 10 clear photos of this vehicle.
            </p>
          </div>

          {vehicle ? (
            <PhotoManager
              vehicle={vehicle}
              onVehicleUpdated={(updated) => setVehicle(updated)}
            />
          ) : (
            <p className="text-xs text-(--ink-soft)">
              Please complete and save basic details first.
            </p>
          )}

          <div className="pt-4 border-t border-(--line) flex items-center justify-between">
            <Button
              type="button"
              variant="quiet"
              size="md"
              onClick={() => setCurrentStep(3)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to pickup
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(5)}
            >
              Continue to documents
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 5: Documents */}
      {currentStep === 5 && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold font-display text-(--ink)">
              Registration and insurance documents
            </h2>
            <p className="text-xs text-(--ink-soft) mt-1">
              Provide vehicle identity numbers, RC and active insurance details.
            </p>
          </div>

          {vehicle ? (
            <DocumentUploader
              vehicle={vehicle}
              user={user}
              onVehicleUpdated={(updated) => setVehicle(updated)}
            />
          ) : (
            <p className="text-xs text-(--ink-soft)">
              Please complete and save basic details first.
            </p>
          )}

          <div className="pt-4 border-t border-(--line) flex items-center justify-between">
            <Button
              type="button"
              variant="quiet"
              size="md"
              onClick={() => setCurrentStep(4)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to photos
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(6)}
            >
              Continue to review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 6: Review & Submit */}
      {currentStep === 6 && (
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold font-display text-(--ink)">
              Review and send for review
            </h2>
            <p className="text-xs text-(--ink-soft) mt-1">
              Check all vehicle information before submitting to the admin team.
            </p>
          </div>

          {submitReviewError && (
            <div
              role="alert"
              className="p-4 rounded-md border border-red-200 bg-red-50 text-xs text-(--negative)"
            >
              {submitReviewError}
            </div>
          )}

          {/* Checklist card */}
          <div className="p-4 rounded-md border border-(--line) bg-(--paper) flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-(--ink-soft)">
              Submission requirements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                <span>Basics and pricing filled</span>
              </div>
              <div className="flex items-center gap-2">
                {hasMinPhotos ? (
                  <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-(--negative)" />
                )}
                <span>
                  Photos ({photoCount} of 3 minimum uploaded)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasRc ? (
                  <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-(--negative)" />
                )}
                <span>RC document uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                {hasInsurance ? (
                  <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-(--negative)" />
                )}
                <span>Insurance document uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                {hasRegNumber ? (
                  <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-(--negative)" />
                )}
                <span>Registration number set</span>
              </div>
              <div className="flex items-center gap-2">
                {hasChassis ? (
                  <CheckCircle2 className="w-4 h-4 text-(--brand)" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-(--negative)" />
                )}
                <span>Chassis number set</span>
              </div>
            </div>
          </div>

          {/* Summary Sections */}
          <div className="divide-y divide-(--line) border border-(--line) rounded-md bg-(--surface)">
            {/* Section: Basics */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs uppercase font-bold text-(--ink-soft)">
                  Vehicle
                </h4>
                <p className="text-sm font-bold text-(--ink) mt-0.5">
                  {vehicle?.brand} {vehicle?.model} {vehicle?.variant} ({vehicle?.year})
                </p>
                <p className="text-xs text-(--ink-soft) capitalize">
                  {vehicle?.type} • {vehicle?.transmission} • {vehicle?.fuelType}
                </p>
              </div>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setCurrentStep(1)}
              >
                Edit
              </Button>
            </div>

            {/* Section: Pricing */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs uppercase font-bold text-(--ink-soft)">
                  Pricing
                </h4>
                <p className="text-sm font-bold text-(--ink) mt-0.5">
                  {formatCurrency(vehicle?.pricing?.perDay || 0)} / day
                </p>
                <p className="text-xs text-(--ink-soft)">
                  Deposit: {formatCurrency(vehicle?.pricing?.deposit || 0)} • Min hours:{" "}
                  {vehicle?.minRentalHours || 4} hrs
                </p>
              </div>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setCurrentStep(2)}
              >
                Edit
              </Button>
            </div>

            {/* Section: Photos */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs uppercase font-bold text-(--ink-soft)">
                  Photos
                </h4>
                <p className="text-sm font-bold text-(--ink) mt-0.5">
                  {photoCount} photo{photoCount === 1 ? "" : "s"} uploaded
                </p>
              </div>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setCurrentStep(4)}
              >
                Manage
              </Button>
            </div>

            {/* Section: Documents */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs uppercase font-bold text-(--ink-soft)">
                  Documents
                </h4>
                <p className="text-sm font-bold text-(--ink) mt-0.5">
                  Reg: {vehicle?.registrationNumber || vehicle?.rc?.registrationNumber || "Not set"}
                </p>
                {vehicle?.insurance?.expiresAt && (
                  <p className="text-xs text-(--ink-soft)">
                    Insurance expires: {formatDate(vehicle.insurance.expiresAt)}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setCurrentStep(5)}
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-(--line) flex items-center justify-between">
            <Button
              type="button"
              variant="quiet"
              size="md"
              onClick={() => setCurrentStep(5)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to documents
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!isReadyForReview || isSubmittingReview}
              isLoading={isSubmittingReview}
              onClick={handleSubmitForReview}
            >
              <Send className="w-4 h-4 mr-2" />
              Send for review
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
