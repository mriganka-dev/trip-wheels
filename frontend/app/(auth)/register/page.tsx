"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, type RegisterFormData } from "@/lib/validations/auth";
import { registerUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const cleanPhone = data.phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: formattedPhone,
        password: data.password,
      });

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many attempts. Please wait a short while and try again.");
        } else {
          setServerError(err.message || "Failed to create account. Please check your details.");
        }
      } else {
        setServerError("A network error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
          New Traveler
        </span>
        <h1 className="mt-1 text-2xl font-bold font-display text-(--ink)">
          Create your account
        </h1>
        <p className="mt-1 text-xs text-(--ink-soft)">
          Sign up to search and request bikes and cars directly from local owners.
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
          label="Email address"
          htmlFor="email"
          required
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="rohan@example.com"
            hasError={Boolean(errors.email)}
            {...register("email")}
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

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 8 characters with at least one letter and one number"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </Field>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Create account
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-(--line) pt-4 text-center text-xs text-(--ink-soft)">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-(--brand) hover:text-(--brand-dark)"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

