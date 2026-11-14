"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resendOtp, resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const resetPasswordFormSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address").toLowerCase(),
    otp: z
      .string()
      .length(6, "Enter all 6 digits of the reset code")
      .regex(/^\d{6}$/, "Code must contain numbers only"),
    newPassword: z
      .string()
      .regex(
        passwordRegex,
        "Password must be at least 8 characters and contain at least one letter and one number"
      ),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [rootError, setRootError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setRootError(null);
    setSuccessMessage(null);
    try {
      await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });

      setSuccessMessage("Password reset successful. Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setRootError("Too many attempts. Please wait a short while and try again.");
          return;
        }

        const msg = err.message.toLowerCase();
        if (msg.includes("expired")) {
          setRootError("The reset code has expired. Please request a new code.");
        } else if (msg.includes("invalid") || msg.includes("incorrect") || msg.includes("wrong")) {
          setRootError("Wrong code. Please check the 6-digit code sent to your email.");
        } else {
          setRootError(err.message || "Failed to reset password. Please try again.");
        }
      } else {
        setRootError("Unable to connect to the server. Please check your connection.");
      }
    }
  };

  const handleResend = async () => {
    const currentEmail = getValues("email");
    if (!currentEmail) {
      setRootError("Please enter your email address to resend the code.");
      return;
    }

    setRootError(null);
    setIsResending(true);
    try {
      await resendOtp({ email: currentEmail, purpose: "reset_password" });
      setSuccessMessage("A new 6-digit reset code has been sent to your email.");
    } catch (err) {
      if (err instanceof ApiError) {
        setRootError(err.message || "Failed to resend code.");
      } else {
        setRootError("Network error. Could not resend code.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Enter the 6-digit code from your email and your new password.
        </p>
      </div>

      {rootError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)">
          {rootError}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-md bg-(--brand-tint)/50 border border-(--brand) text-sm text-(--brand-dark)">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          label="Email address"
          htmlFor="email"
          required
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="e.g. partner@example.com"
            hasError={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field
          label="6-digit reset code"
          required
          error={errors.otp?.message}
        >
          <div className="py-1">
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setValue("otp", val, { shouldValidate: true });
              }}
              hasError={Boolean(errors.otp)}
              disabled={isSubmitting}
            />
          </div>
        </Field>

        <Field
          label="New password"
          htmlFor="newPassword"
          required
          hint="At least 8 characters with a letter and a number"
          error={errors.newPassword?.message}
        >
          <Input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            hasError={Boolean(errors.newPassword)}
            {...register("newPassword")}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            hasError={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </Field>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            Update password
          </Button>
        </div>
      </form>

      <div className="flex flex-col items-center gap-3 pt-2 text-center text-sm text-(--ink-soft)">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-xs text-(--brand) hover:underline font-medium cursor-pointer disabled:opacity-60"
        >
          {isResending ? "Sending code..." : "Resend 6-digit code"}
        </button>

        <div className="pt-2 border-t border-(--line) w-full">
          <Link href="/login" className="text-xs text-(--ink-soft) hover:text-(--ink)">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-(--ink-soft)">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
