"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getActiveDestinations } from "@/lib/api/destinations";
import { updatePublisherProfile } from "@/lib/api/publisher";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { PinPicker } from "@/components/maps/pin-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/layout/app-shell";
import type { Destination } from "@/types/destination";
import type { UpdateProfilePayload } from "@/types/verification";

interface ProfileFormData {
  businessName: string;
  businessAddress: string;
  gstNumber: string;
  destination: string;
  pickupAddress: string;
  pickupLandmark: string;
  individualCity: string;
  individualArea: string;
}

export default function VerificationProfilePage() {
  const router = useRouter();
  const { user, profile, refetchProfile, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const coordinates: [number, number] | undefined =
    selectedCoordinates ?? profile?.agentPickup?.location?.coordinates;
  const [rootError, setRootError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAgent = user?.role === "agent";
  const isPending = profile?.verificationStatus === "pending";

  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: queryKeys.destinations.list,
    queryFn: getActiveDestinations,
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProfileFormData>({
    values: {
      businessName: profile?.businessName || "",
      businessAddress: profile?.businessAddress || "",
      gstNumber: profile?.gstNumber || "",
      destination: profile?.destination || "",
      pickupAddress: profile?.agentPickup?.address || "",
      pickupLandmark: profile?.agentPickup?.landmark || "",
      individualCity: profile?.individualArea?.city || "",
      individualArea: profile?.individualArea?.area || "",
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (isPending) return;

    setRootError(null);
    setSaveSuccess(false);

    const payload: UpdateProfilePayload = {
      destination: data.destination || undefined,
    };

    if (isAgent) {
      payload.businessName = data.businessName || undefined;
      payload.businessAddress = data.businessAddress || undefined;
      payload.gstNumber = data.gstNumber || undefined;
      payload.agentPickup = {
        address: data.pickupAddress || undefined,
        landmark: data.pickupLandmark || undefined,
        location: coordinates
          ? {
              type: "Point",
              coordinates,
            }
          : undefined,
      };
    } else {
      payload.individualArea = {
        city: data.individualCity || undefined,
        area: data.individualArea || undefined,
      };
    }

    try {
      await updatePublisherProfile(payload);
      await refetchProfile();
      setSaveSuccess(true);
      showToast("Profile details saved", "brand");
      setTimeout(() => {
        router.push("/verification");
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError) {
        setRootError(err.message || "Failed to save profile. Please check the entered fields.");
      } else {
        setRootError("Network error. Please try again.");
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="p-8 text-center text-sm text-(--ink-soft)">
        Loading profile details...
      </div>
    );
  }

  return (
    <AppShell
      title={isAgent ? "Business details" : "Pickup area"}
      subtitle={isAgent ? "Shop information and pickup location" : "Set your operating area"}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Back button & title */}
      <div className="flex items-center gap-3">
        <Link
          href="/verification"
          className="p-2 rounded-md hover:bg-(--paper) text-(--ink-soft) hover:text-(--ink) transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to verification overview"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-display text-(--ink)">
            {isAgent ? "Business details & pickup location" : "Pickup area & destination"}
          </h1>
          <p className="text-xs text-(--ink-soft)">
            {isAgent
              ? "Set your shop details and the fixed counter location for vehicle pick-up."
              : "Specify your general operating destination and local pickup zone."}
          </p>
        </div>
      </div>

      {isPending && (
        <div className="p-4 rounded-md bg-(--paper) border border-(--line) text-sm text-(--ink-soft) flex items-center gap-3">
          <Lock className="w-5 h-5 text-(--ink) shrink-0" />
          <span>Profile editing is locked while your application is under review.</span>
        </div>
      )}

      {rootError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)">
          {rootError}
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 rounded-md bg-(--brand-tint)/50 border border-(--brand) text-sm text-(--brand-dark) flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Profile updated successfully. Returning to checklist...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Operating Destination (common) */}
        <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
          <h2 className="text-sm font-bold font-display text-(--ink)">
            Operating destination
          </h2>

          <Field
            label="Destination"
            htmlFor="destination-select"
            required
            hint="The primary tourist destination where your vehicles operate"
          >
            <Select
              id="destination-select"
              disabled={isPending}
              {...register("destination")}
            >
              <option value="">Select destination...</option>
              {destinations.map((dest) => (
                <option key={dest._id} value={dest.name}>
                  {dest.name} ({dest.state})
                </option>
              ))}
            </Select>
          </Field>
        </section>

        {/* Agent specific business fields */}
        {isAgent && (
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <h2 className="text-sm font-bold font-display text-(--ink)">
              Shop details
            </h2>

            <Field
              label="Business / Shop name"
              htmlFor="businessName"
              required
              hint="Official rental shop name as displayed on your signage or paperwork"
            >
              <Input
                id="businessName"
                placeholder="e.g. Royal Wheels Bike Rentals"
                disabled={isPending}
                {...register("businessName")}
              />
            </Field>

            <Field
              label="Business address"
              htmlFor="businessAddress"
              required
              hint="Physical shop or counter address"
            >
              <Input
                id="businessAddress"
                placeholder="Shop No. 4, Beach Road, Calangute"
                disabled={isPending}
                {...register("businessAddress")}
              />
            </Field>

            <Field
              label="GST number (optional)"
              htmlFor="gstNumber"
              hint="Optional 15-character Goods and Services Tax identifier"
            >
              <Input
                id="gstNumber"
                placeholder="e.g. 30AAAAA0000A1Z5"
                disabled={isPending}
                {...register("gstNumber")}
              />
            </Field>
          </section>
        )}

        {/* Agent specific pickup location with PinPicker */}
        {isAgent && (
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold font-display text-(--ink)">
                Fixed pickup location
              </h2>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                This exact point is shared with travelers after you accept their booking. It must be accurate.
              </p>
            </div>

            <Field
              label="Pickup counter address"
              htmlFor="pickupAddress"
              required
            >
              <Input
                id="pickupAddress"
                placeholder="e.g. Near Calangute Bus Stand, Opp. SBI"
                disabled={isPending}
                {...register("pickupAddress")}
              />
            </Field>

            <Field
              label="Prominent landmark"
              htmlFor="pickupLandmark"
              hint="Helps customers find your counter easily on arrival"
            >
              <Input
                id="pickupLandmark"
                placeholder="e.g. Opposite Post Office"
                disabled={isPending}
                {...register("pickupLandmark")}
              />
            </Field>

            <div className="pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-(--ink-soft) block mb-2">
                Map pin location *
              </label>
              <PinPicker
                value={coordinates}
                onChange={setSelectedCoordinates}
              />
            </div>
          </section>
        )}

        {/* Individual specific area fields */}
        {!isAgent && (
          <section className="p-6 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold font-display text-(--ink)">
                Pickup area
              </h2>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                Customers see only this general area. You agree the exact pickup point with each customer after you accept.
              </p>
            </div>

            <Field
              label="City"
              htmlFor="individualCity"
              required
            >
              <Input
                id="individualCity"
                placeholder="e.g. Panaji"
                disabled={isPending}
                {...register("individualCity")}
              />
            </Field>

            <Field
              label="Area / Neighborhood"
              htmlFor="individualArea"
              required
              hint="The general neighborhood where you hand over vehicles"
            >
              <Input
                id="individualArea"
                placeholder="e.g. Miramar / Dona Paula"
                disabled={isPending}
                {...register("individualArea")}
              />
            </Field>
          </section>
        )}

        {/* Action Buttons */}
        {!isPending && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
            >
              Save details
            </Button>
            <Link href="/verification">
              <Button variant="secondary" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        )}
      </form>
      </div>
    </AppShell>
  );
}
