"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword, resendOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { OtpInput } from "@/components/ui/otp-input";
import { useToast } from "@/components/ui/toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    if (otp.length !== 6) {
      setErrorMessage("Please enter the complete 6 digit code.");
      return;
    }
    if (newPassword.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setErrorMessage("Password must be at least 8 characters long and contain at least one letter and one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp,
        newPassword,
      });

      showToast("Password reset successful. Please sign in.", "positive");
      router.push("/login?reset=true");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage("Too many attempts. Please request a new code or wait before trying again.");
        } else {
          setErrorMessage(err.message || "Failed to reset password. Please check the code and try again.");
        }
      } else {
        setErrorMessage("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!email.trim() || resendCooldown > 0 || isResending) return;

    setErrorMessage(null);
    setIsResending(true);

    try {
      await resendOtp({ email: email.trim(), purpose: "reset_password" });
      setSuccessMessage("A fresh reset code has been sent to your email.");
      setResendCooldown(60);
      setOtp("");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || "Unable to resend reset code.");
      } else {
        setErrorMessage("Failed to resend code due to a network error.");
      }
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending]);

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-6 sm:p-8">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
          Account Recovery
        </span>
        <h1 className="mt-1 text-2xl font-bold font-display text-(--ink)">
          Set new password
        </h1>
        <p className="mt-1 text-xs text-(--ink-soft)">
          Enter the 6 digit code sent to your email and your new password.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-(--negative)"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-6 rounded-md border border-(--brand) bg-(--brand-tint) p-3 text-xs text-(--brand-dark)"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        {!initialEmail && (
          <Field label="Email address" htmlFor="reset-email" required>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
        )}

        {initialEmail && (
          <div className="rounded-md bg-(--paper) p-3 text-center border border-(--line)">
            <span className="text-xs text-(--ink-soft)">Account: </span>
            <span className="text-xs font-semibold text-(--ink)">{initialEmail}</span>
          </div>
        )}

        <div className="py-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-(--ink-soft) mb-2 text-center">
            6 Digit Recovery Code
          </label>
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (errorMessage) setErrorMessage(null);
            }}
            hasError={Boolean(errorMessage)}
            disabled={isSubmitting}
          />
        </div>

        <Field
          label="New password"
          htmlFor="newPassword"
          required
          hint="At least 8 characters with at least one letter and one number"
        >
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="confirmPassword"
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting || otp.length !== 6}
            isLoading={isSubmitting}
          >
            Reset password
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-(--line) pt-4 flex flex-col items-center gap-2 text-xs text-(--ink-soft)">
        <div>
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="font-semibold text-(--brand) hover:text-(--brand-dark) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="text-(--ink-soft) hover:text-(--ink) transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center text-xs text-(--ink-soft)">
          Loading password reset form...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

