"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { DigitBoxes } from "@/components/ui/digit-boxes";
import { resendOtp, resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { APP_NAME } from "@/lib/constants";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
    otp: z
      .string()
      .length(6, "Verification code must be exactly 6 digits")
      .regex(/^\d{6}$/, "Code must contain only digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(passwordRegex, "Password must contain at least one letter and one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    const emailToResend = getValues("email");
    if (!emailToResend || resendCooldown > 0) return;
    setIsResending(true);
    setServerError(null);
    setResendMessage(null);

    try {
      await resendOtp({
        email: emailToResend,
        purpose: "reset_password",
      });
      setResendCooldown(60);
      setResendMessage("A new verification code has been sent to your email.");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many verification attempts. Please wait before requesting another code.");
          return;
        }
        setServerError(err.message || "Failed to resend code.");
      } else {
        setServerError("Failed to connect to the server.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ResetFormData) => {
    setServerError(null);
    try {
      await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many failed attempts. Please wait a few minutes before trying again.");
          return;
        }
        const msg = err.message ? err.message.toLowerCase() : "";
        if (msg.includes("expired")) {
          setServerError("Verification code has expired. Please request a new code below.");
          return;
        }
        if (msg.includes("invalid") || msg.includes("wrong") || msg.includes("incorrect")) {
          setServerError("The verification code is incorrect. Please check and try again.");
          return;
        }
        setServerError(err.message || "Failed to reset password.");
      } else {
        setServerError("Failed to connect to the server.");
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-surface border border-line rounded p-6 sm:p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-ink">Password updated</h1>
          <p className="text-sm text-ink-soft mt-2 mb-6">
            Your admin password has been reset successfully. You can now sign in with your new credentials.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-surface border border-line rounded p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <span className="font-display font-semibold text-xl text-ink block">
            {APP_NAME}
          </span>
          <h1 className="text-base font-semibold text-ink mt-2">
            Enter reset code
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Provide the 6-digit code sent to your email along with your new password.
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

        {resendMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded bg-brand-tint border border-brand/30 text-xs text-brand font-medium"
          >
            {resendMessage}
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

          <Field
            label="6-digit verification code"
            error={errors.otp?.message}
            hint="Check your inbox or spam folder"
          >
            <Controller
              control={control}
              name="otp"
              render={({ field }) => (
                <DigitBoxes
                  value={field.value}
                  onChange={field.onChange}
                  hasError={Boolean(errors.otp)}
                  disabled={isSubmitting}
                />
              )}
            />
          </Field>

          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Did not receive code?</span>
            {resendCooldown > 0 ? (
              <span>Resend code in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-brand hover:text-brand-dark font-medium cursor-pointer"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>

          <Field
            label="New password"
            htmlFor="newPassword"
            error={errors.newPassword?.message}
            hint="Minimum 8 characters with at least one letter and one number"
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              hasError={Boolean(errors.newPassword)}
              disabled={isSubmitting}
              {...register("newPassword")}
            />
          </Field>

          <Field
            label="Confirm new password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              hasError={Boolean(errors.confirmPassword)}
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Reset password
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
