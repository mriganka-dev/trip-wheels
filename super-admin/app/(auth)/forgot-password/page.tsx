"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { APP_NAME } from "@/lib/constants";

const forgotSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setServerError(null);
    try {
      await forgotPassword(data);
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many password reset requests. Please wait a few minutes before trying again.");
          return;
        }
        setServerError(err.message || "Failed to send reset code.");
      } else {
        setServerError("Failed to connect to the server.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-surface border border-line rounded p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <span className="font-display font-semibold text-xl text-ink block">
            {APP_NAME}
          </span>
          <h1 className="text-base font-semibold text-ink mt-2">
            Reset your password
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Enter your admin email address to receive a 6-digit verification code.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded bg-[#FDF0EF] border border-negative/30 text-xs text-negative font-medium"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Email address"
            htmlFor="email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@tripwheels.in"
              hasError={Boolean(errors.email)}
              disabled={isSubmitting}
              {...register("email")}
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Send verification code
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center">
          <Link
            href="/login"
            className="text-xs text-ink-soft hover:text-ink font-medium"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
