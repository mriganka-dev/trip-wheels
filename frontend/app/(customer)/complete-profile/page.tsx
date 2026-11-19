"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  completeProfileFormSchema,
  type CompleteProfileFormData,
} from "@/lib/validations/auth";
import { completeProfile } from "@/lib/api/auth";
import { ApiError, isApiError } from "@/lib/api/client";
import { getSafeRedirectUrl } from "@/lib/safe-redirect";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const { user, profileComplete, isLoading, refreshUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!isLoading && profileComplete) {
      const destination = getSafeRedirectUrl(nextParam);
      router.push(destination);
    }
  }, [isLoading, profileComplete, nextParam, router]);

  useEffect(() => {
    if (user?.fullName) {
      reset({
        fullName: user.fullName,
        phone: "",
      });
    }
  }, [user?.fullName, reset]);

  const onSubmit = async (data: CompleteProfileFormData) => {
    setServerError(null);
    try {
      const cleanPhone = data.phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("91")
        ? cleanPhone
        : `91${cleanPhone}`;

      await completeProfile({
        fullName: data.fullName,
        phone: formattedPhone,
      });

      if (refreshUser) {
        await refreshUser();
      }
      const destination = getSafeRedirectUrl(nextParam);
      router.push(destination);
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

      // If profile is already marked complete, redirect directly to destination
      if (
        message.toLowerCase().includes("already complete") ||
        (apiErr?.statusCode === 400 && message.toLowerCase().includes("already complete"))
      ) {
        const destination = getSafeRedirectUrl(nextParam);
        router.push(destination);
        return;
      }

      setServerError(message);
    }
  };

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8 max-w-md mx-auto">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
          Trip Wheels Account
        </span>
        <h1 className="mt-1 text-2xl font-bold font-display text-(--ink)">
          Complete your profile
        </h1>
        <p className="mt-1 text-xs text-(--ink-soft)">
          Owners see your phone number after they accept your booking.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-(--negative)"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={errors.fullName?.message}
        >
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Rohan Sharma"
            hasError={Boolean(errors.fullName)}
            {...register("fullName")}
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor="phone"
          required
          hint="10 digit Indian number without country code"
          error={errors.phone?.message}
        >
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm text-(--ink-soft) select-none font-medium">
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel-national"
              placeholder="9876543210"
              className="pl-12"
              hasError={Boolean(errors.phone)}
              {...register("phone")}
            />
          </div>
        </Field>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
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
        <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center text-xs text-(--ink-soft) max-w-md mx-auto">
          Loading profile form...
        </div>
      }
    >
      <CompleteProfileForm />
    </Suspense>
  );
}
