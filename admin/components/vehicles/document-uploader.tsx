"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { useToast } from "@/components/ui/toast";
import { uploadVehicleDocuments } from "@/lib/api/vehicles";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";
import type { User } from "@/types/auth";

const documentsSchema = z.object({
  chassisNumber: z
    .string()
    .trim()
    .min(3, "Chassis number must be at least 3 characters")
    .max(30, "Chassis number cannot exceed 30 characters"),
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Registration number must be at least 3 characters")
    .max(20, "Registration number cannot exceed 20 characters")
    .regex(
      /^[A-Za-z0-9]+$/,
      "Registration number must contain only letters and numbers"
    ),
  rcOwnerName: z
    .string()
    .trim()
    .min(2, "RC owner name is required")
    .max(100, "RC owner name cannot exceed 100 characters"),
  insurancePolicyNumber: z
    .string()
    .trim()
    .min(3, "Insurance policy number is required")
    .max(50, "Insurance policy number cannot exceed 50 characters"),
  insuranceExpiresAt: z
    .string()
    .min(1, "Insurance expiry date is required"),
});

type DocumentsFormData = z.infer<typeof documentsSchema>;

interface DocumentUploaderProps {
  vehicle: Vehicle;
  user: User | null;
  onVehicleUpdated: (updated: Vehicle) => void;
  disabled?: boolean;
}

export function DocumentUploader({
  vehicle,
  user,
  onVehicleUpdated,
  disabled = false,
}: DocumentUploaderProps) {
  const { showToast } = useToast();
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [nocFile, setNocFile] = useState<File | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);

  const defaultExpiry = vehicle.insurance?.expiresAt
    ? new Date(vehicle.insurance.expiresAt).toISOString().split("T")[0]
    : "";

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    values: {
      chassisNumber: vehicle.chassisNumber || "",
      registrationNumber:
        vehicle.registrationNumber || vehicle.rc?.registrationNumber || "",
      rcOwnerName: vehicle.rc?.ownerName || "",
      insurancePolicyNumber: vehicle.insurance?.policyNumber || "",
      insuranceExpiresAt: defaultExpiry,
    },
  });

  const enteredRcOwnerName = useWatch({ control, name: "rcOwnerName" });
  const showMismatchWarning = Boolean(
    user?.fullName &&
      enteredRcOwnerName &&
      enteredRcOwnerName.trim().toLowerCase() !== user.fullName.trim().toLowerCase()
  );

  const hasExistingRc = Boolean(vehicle.rc?.file?.url);
  const hasExistingInsurance = Boolean(vehicle.insurance?.file?.url);
  const hasExistingNoc = Boolean(vehicle.noc?.file?.url);

  const onSubmit = async (data: DocumentsFormData) => {
    if (disabled) return;
    setRootError(null);

    // Require RC file if none already on record
    if (!hasExistingRc && !rcFile) {
      setRootError("Please upload a copy of the RC document.");
      return;
    }

    // Require Insurance file if none already on record
    if (!hasExistingInsurance && !insuranceFile) {
      setRootError("Please upload a copy of the active insurance document.");
      return;
    }

    try {
      const updated = await uploadVehicleDocuments(vehicle._id, {
        chassisNumber: data.chassisNumber,
        registrationNumber: data.registrationNumber.toUpperCase(),
        rcOwnerName: data.rcOwnerName,
        insurancePolicyNumber: data.insurancePolicyNumber,
        insuranceExpiresAt: new Date(data.insuranceExpiresAt).toISOString(),
        rc: rcFile || undefined,
        insurance: insuranceFile || undefined,
        noc: nocFile || undefined,
      });

      onVehicleUpdated(updated);
      setRcFile(null);
      setInsuranceFile(null);
      setNocFile(null);
      showToast("Registration and insurance documents saved.", "brand");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setError("registrationNumber", {
            message:
              "A vehicle with this registration number is already listed on Trip Wheels.",
          });
          return;
        }
        setRootError(err.message);
      } else {
        setRootError("Failed to save documents. Please check your connection.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {rootError && (
        <div
          role="alert"
          className="p-4 rounded-md border border-red-200 bg-red-50 text-xs text-(--negative) flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{rootError}</span>
        </div>
      )}

      {/* Vehicle Identity Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Chassis number *"
          error={errors.chassisNumber?.message}
          hint="Find this on your vehicle's RC or frame."
        >
          <Input
            {...register("chassisNumber")}
            placeholder="MD2A..."
            disabled={disabled || isSubmitting}
          />
        </Field>

        <Field
          label="Registration number *"
          error={errors.registrationNumber?.message}
          hint="Uppercase letters and numbers only, without spaces."
        >
          <Input
            {...register("registrationNumber")}
            placeholder="GA07AB1234"
            disabled={disabled || isSubmitting}
            className="uppercase font-mono"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[\s-]/g, "");
            }}
          />
        </Field>
      </div>

      {/* RC Section */}
      <div className="p-4 rounded-md border border-(--line) bg-(--paper) flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-(--brand)" />
            <h3 className="text-sm font-bold font-display text-(--ink)">
              Registration Certificate (RC) *
            </h3>
          </div>
          {hasExistingRc && (
            <span className="inline-flex items-center gap-1 text-xs text-(--brand) font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              RC on file
            </span>
          )}
        </div>

        <Field
          label="Owner name as printed on RC *"
          error={errors.rcOwnerName?.message}
        >
          <Input
            {...register("rcOwnerName")}
            placeholder="Name matching the RC card"
            disabled={disabled || isSubmitting}
          />
        </Field>

        {showMismatchWarning && (
          <div className="p-3 rounded bg-(--surface) border border-(--line) text-xs text-(--ink-soft) flex items-start gap-2">
            <Info className="w-4 h-4 text-(--ink-soft) shrink-0 mt-0.5" />
            <span>
              The owner name on this RC differs from your registered account name.
              Our team may ask you for a document to confirm ownership.
            </span>
          </div>
        )}

        <Field
          label={hasExistingRc ? "Replace RC document (PDF or Image)" : "Upload RC document *"}
        >
          <FileInput
            accept="application/pdf,image/jpeg,image/png"
            maxSizeMb={5}
            disabled={disabled || isSubmitting}
            onChange={(file) => setRcFile(file)}
          />
        </Field>
      </div>

      {/* Insurance Section */}
      <div className="p-4 rounded-md border border-(--line) bg-(--paper) flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-(--brand)" />
            <h3 className="text-sm font-bold font-display text-(--ink)">
              Insurance policy *
            </h3>
          </div>
          {hasExistingInsurance && (
            <span className="inline-flex items-center gap-1 text-xs text-(--brand) font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Insurance on file
              {vehicle.insurance?.expiresAt && ` (Exp: ${formatDate(vehicle.insurance.expiresAt)})`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Policy number *"
            error={errors.insurancePolicyNumber?.message}
          >
            <Input
              {...register("insurancePolicyNumber")}
              placeholder="POL-12345678"
              disabled={disabled || isSubmitting}
            />
          </Field>

          <Field
            label="Expiry date *"
            error={errors.insuranceExpiresAt?.message}
            hint="Must be an active policy."
          >
            <Input
              type="date"
              {...register("insuranceExpiresAt")}
              disabled={disabled || isSubmitting}
            />
          </Field>
        </div>

        <Field
          label={
            hasExistingInsurance
              ? "Replace insurance document (PDF or Image)"
              : "Upload insurance document *"
          }
        >
          <FileInput
            accept="application/pdf,image/jpeg,image/png"
            maxSizeMb={5}
            disabled={disabled || isSubmitting}
            onChange={(file) => setInsuranceFile(file)}
          />
        </Field>
      </div>

      {/* NOC Section (Optional) */}
      <div className="p-4 rounded-md border border-(--line) bg-(--paper) flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-(--ink-soft)" />
            <h3 className="text-sm font-bold font-display text-(--ink)">
              No Objection Certificate (NOC)
            </h3>
          </div>
          {hasExistingNoc && (
            <span className="inline-flex items-center gap-1 text-xs text-(--brand) font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              NOC on file
            </span>
          )}
        </div>

        <p className="text-xs text-(--ink-soft)">
          Needed if the vehicle belongs to a family member or business partner.
        </p>

        <Field
          label={
            hasExistingNoc
              ? "Replace NOC document (PDF or Image)"
              : "Upload NOC document (optional)"
          }
        >
          <FileInput
            accept="application/pdf,image/jpeg,image/png"
            maxSizeMb={5}
            disabled={disabled || isSubmitting}
            onChange={(file) => setNocFile(file)}
          />
        </Field>
      </div>

      {!disabled && (
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            size="md"
            isLoading={isSubmitting}
          >
            Save documents
          </Button>
        </div>
      )}
    </form>
  );
}
