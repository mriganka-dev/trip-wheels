"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { ApiError } from "@/lib/api/client";
import { APP_NAME } from "@/lib/constants";

const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(3, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  usePageTitle("Sign in");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const idleNotice = searchParams.get("reason") === "idle";
  const rawNext = searchParams.get("next");
  const nextUrl =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes(":") && !rawNext.includes("\\")
      ? rawNext
      : "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await login(data);
      if (response.user.role !== "admin") {
        setServerError("This console is for the Trip Wheels team.");
        return;
      }
      router.push(nextUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many sign-in attempts. Please wait a few minutes before trying again.");
          return;
        }
        if (err.message && err.message.toLowerCase().includes("suspended")) {
          setServerError("This account has been suspended. Please contact the platform team.");
          return;
        }
        setServerError(err.message || "Invalid credentials.");
      } else {
        setServerError("Failed to sign in. Please verify your connection.");
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
          <h1 className="text-sm font-medium text-ink-soft mt-1">
            Super Admin Console
          </h1>
        </div>

        {idleNotice && (
          <div
            role="status"
            className="mb-4 p-3 rounded bg-paper border border-line text-xs text-ink-soft"
          >
            You were signed out due to inactivity.
          </div>
        )}

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
            label="Email or phone number"
            htmlFor="emailOrPhone"
            error={errors.emailOrPhone?.message}
          >
            <Input
              id="emailOrPhone"
              autoComplete="username"
              placeholder="admin@tripwheels.in"
              hasError={Boolean(errors.emailOrPhone)}
              disabled={isSubmitting}
              {...register("emailOrPhone")}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              hasError={Boolean(errors.password)}
              disabled={isSubmitting}
              {...register("password")}
            />
          </Field>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-brand hover:text-brand-dark"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Sign in
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center">
          <p className="text-xs text-ink-soft">
            Accounts are created by the platform team.
          </p>
        </div>
      </div>
    </div>
  );
}
