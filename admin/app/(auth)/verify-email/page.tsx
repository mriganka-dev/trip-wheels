"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resendOtp, verifyEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorMessage("Please provide your email address.");
      return;
    }
    if (otp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await verifyEmail({ email, otp });
      setSuccessMessage("Email verified successfully. Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/verification");
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage("Too many attempts. Please wait a short while and try again.");
          return;
        }

        const msg = err.message.toLowerCase();
        if (msg.includes("expired")) {
          setErrorMessage("Verification code has expired. Please request a new code.");
        } else if (msg.includes("invalid") || msg.includes("incorrect") || msg.includes("wrong")) {
          setErrorMessage("Wrong code. Please check the 6-digit code sent to your email.");
        } else if (msg.includes("already verified")) {
          setSuccessMessage("Your email is already verified. Please sign in.");
          setTimeout(() => router.push("/login"), 1500);
        } else {
          setErrorMessage(err.message || "Verification failed. Please try again.");
        }
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || !email) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      await resendOtp({ email, purpose: "verify_email" });
      setSuccessMessage("A fresh 6-digit code has been sent to your email.");
      setCooldownSeconds(60);
      setOtp("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage("Too many OTP requests. Please wait a few minutes before trying again.");
        } else {
          setErrorMessage(err.message || "Failed to resend code.");
        }
      } else {
        setErrorMessage("Network error. Could not request a new code.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Verify your email
        </h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Enter the 6-digit verification code sent to your email address.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-md bg-(--brand-tint)/50 border border-(--brand) text-sm text-(--brand-dark)">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {!initialEmail && (
          <Field label="Email address" htmlFor="verify-email-input" required>
            <Input
              id="verify-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. partner@example.com"
            />
          </Field>
        )}

        {initialEmail && (
          <div className="text-xs text-(--ink-soft) p-2.5 rounded bg-(--paper) border border-(--line) flex items-center justify-between">
            <span>Code sent to <strong className="text-(--ink)">{initialEmail}</strong></span>
            <button
              type="button"
              onClick={() => setEmail("")}
              className="text-(--brand) hover:underline font-medium text-xs cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        <div className="py-2">
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (val.length === 6) {
                // Auto-submit when 6 digits entered
                setTimeout(() => {
                  handleSubmit();
                }, 100);
              }
            }}
            hasError={Boolean(errorMessage)}
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={otp.length !== 6 || isSubmitting}
          isLoading={isSubmitting}
        >
          Confirm code
        </Button>
      </form>

      {/* Resend actions */}
      <div className="pt-2 text-center text-sm text-(--ink-soft) flex flex-col items-center gap-2">
        {cooldownSeconds > 0 ? (
          <span className="text-xs">
            Resend available in {cooldownSeconds} seconds
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-xs font-semibold text-(--brand) hover:underline cursor-pointer disabled:opacity-60"
          >
            {isResending ? "Sending code..." : "Resend 6-digit code"}
          </button>
        )}

        <div className="pt-4 border-t border-(--line) w-full">
          <Link href="/login" className="text-xs text-(--ink-soft) hover:text-(--ink)">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-(--ink-soft)">Loading verification...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
