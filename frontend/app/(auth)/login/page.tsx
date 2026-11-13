"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema, type LoginFormData } from "@/lib/validations/auth";
import { ApiError } from "@/lib/api/client";
import { getSafeRedirectUrl } from "@/lib/safe-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useAuth } from "@/hooks/use-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const verifiedParam = searchParams.get("verified");

  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await login(data);

      if (response.user.role !== "customer") {
        router.push("/non-customer");
        return;
      }

      const redirectTarget = getSafeRedirectUrl(nextParam);
      router.push(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setServerError("Too many failed attempts. Please wait a few minutes before trying again.");
        } else if (err.statusCode === 403 && err.message.toLowerCase().includes("suspended")) {
          setServerError(err.message);
        } else {
          setServerError(err.message || "Invalid credentials. Please verify your email or phone and password.");
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
          Welcome Back
        </span>
        <h1 className="mt-1 text-2xl font-bold font-display text-(--ink)">
          Sign in
        </h1>
        <p className="mt-1 text-xs text-(--ink-soft)">
          Access your bookings, saved destinations and trip alerts.
        </p>
      </div>

      {verifiedParam && (
        <div
          role="status"
          className="mb-6 rounded-md border border-(--brand) bg-(--brand-tint) p-3 text-xs text-(--brand-dark)"
        >
          Your email has been verified. You can now sign in to your account.
        </div>
      )}

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
          label="Email or mobile number"
          htmlFor="emailOrPhone"
          required
          error={errors.emailOrPhone?.message}
        >
          <Input
            id="emailOrPhone"
            autoComplete="username"
            placeholder="rohan@example.com or 9876543210"
            hasError={Boolean(errors.emailOrPhone)}
            {...register("emailOrPhone")}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            hasError={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-(--brand) hover:text-(--brand-dark)"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-(--line) pt-4 text-center text-xs text-(--ink-soft)">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/register"
          className="font-semibold text-(--brand) hover:text-(--brand-dark)"
        >
          Create your account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center text-xs text-(--ink-soft)">
          Loading login form...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

