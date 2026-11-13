"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await forgotPassword(data);
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many password reset requests. Please wait before trying again.");
        } else {
          setServerError(err.message || "Failed to process request. Please try again.");
        }
      } else {
        setServerError("Network error. Please check your connection and try again.");
      }
    }
  };

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
          Account Recovery
        </span>
        <h1 className="mt-1 text-2xl font-bold font-display text-(--ink)">
          Reset your password
        </h1>
        <p className="mt-1 text-xs text-(--ink-soft)">
          Enter your registered email address to receive a 6 digit recovery code.
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
          label="Registered email address"
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

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Send recovery code
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-(--line) pt-4 text-center text-xs text-(--ink-soft)">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-(--brand) hover:text-(--brand-dark)"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

