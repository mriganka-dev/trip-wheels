"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setRootError(null);
    try {
      await forgotPassword({ email: data.email });
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setRootError("Too many password reset requests. Please wait before trying again.");
          return;
        }
        setRootError(err.message || "Failed to send reset code. Please try again.");
      } else {
        setRootError("Unable to connect to the server. Please check your connection.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Enter your registered email address to receive a 6-digit reset code.
        </p>
      </div>

      {rootError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)">
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          label="Registered email address"
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

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            Send reset code
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-(--line) text-center text-sm text-(--ink-soft)">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-(--brand) hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
