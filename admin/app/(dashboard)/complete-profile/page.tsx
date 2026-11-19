"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { completeProfile } from "@/lib/api/auth";
import { ApiError, isApiError } from "@/lib/api/client";
import { DASHBOARD_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const completeProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

function CompleteProfileForm() {
  const router = useRouter();
  const { user, profile, profileComplete, isLoading, refetchUser } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Complete your profile | ${DASHBOARD_NAME}`;
  }, []);

  const ownerType =
    profile?.publisherType ||
    (user?.role === "agent" || user?.role === "individual"
      ? user.role
      : "agent");

  const ownerTypeLabel = ownerType === "agent" ? "Agent" : "Individual";

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!isLoading && profileComplete) {
      router.push("/verification");
    }
  }, [isLoading, profileComplete, router]);

  useEffect(() => {
    if (user?.fullName) {
      reset({
        fullName: user.fullName,
        phone: "",
      });
    }
  }, [user?.fullName, reset]);

  const onSubmit = async (data: CompleteProfileFormData) => {
    setRootError(null);
    try {
      const cleanPhone = data.phone.replace(/\D/g, "");
      const formattedPhone = `91${cleanPhone}`;

      await completeProfile({
        fullName: data.fullName,
        phone: formattedPhone,
      });

      if (refetchUser) {
        await refetchUser();
      }
      router.push("/verification");
    } catch (err: unknown) {
      console.error("Complete profile error:", err);
      const apiErr = isApiError(err) ? err : null;
      const genericErr = err instanceof Error ? err : null;
      const message =
        apiErr?.message ||
        genericErr?.message ||
        (typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : null) ||
        (typeof err === "string" ? err : null) ||
        "Could not complete profile. Please try again.";

      if (
        apiErr?.statusCode === 409 ||
        message.toLowerCase().includes("phone number is already in use")
      ) {
        setError("phone", {
          message: message || "Phone number is already in use",
        });
        return;
      }

      // If profile is already marked complete, redirect directly to verification
      if (
        message.toLowerCase().includes("already complete") ||
        (apiErr?.statusCode === 400 && message.toLowerCase().includes("already complete"))
      ) {
        router.push("/verification");
        return;
      }

      setRootError(message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-md border border-(--line) bg-(--surface) flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Complete your profile
        </h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          We call this number to verify your account, and customers see it after you accept a booking.
        </p>
      </div>

      {rootError && (
        <div
          role="alert"
          className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)"
        >
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Owner type: shown but not editable */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-(--ink-soft)">
            Owner type
          </label>
          <div className="p-3 rounded-md border border-(--line) bg-(--paper) text-sm font-medium text-(--ink)">
            {ownerTypeLabel}
          </div>
          <span className="text-xs text-(--ink-soft)">
            Set during registration and cannot be changed.
          </span>
        </div>

        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={errors.fullName?.message}
        >
          <Input
            id="fullName"
            placeholder="e.g. Ramesh Patel"
            hasError={Boolean(errors.fullName)}
            {...register("fullName")}
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor="phone"
          required
          hint="10-digit Indian mobile number"
          error={errors.phone?.message}
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center px-3 text-sm font-medium border border-(--line) bg-(--paper) rounded-md text-(--ink-soft) min-h-[44px]">
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="98765 43210"
              maxLength={10}
              hasError={Boolean(errors.phone)}
              {...register("phone")}
            />
          </div>
        </Field>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            Save and continue
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-(--ink-soft)">
          Loading profile...
        </div>
      }
    >
      <CompleteProfileForm />
    </Suspense>
  );
}
