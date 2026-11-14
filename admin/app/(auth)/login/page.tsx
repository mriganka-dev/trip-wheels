"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(3, "Enter your email address or mobile number"),
  password: z.string().min(1, "Enter your password"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const { login } = useAuth();

  const [rootError, setRootError] = useState<string | null>(null);

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

  const getSafeNextPath = (candidate: string | null): string => {
    if (!candidate) return "/";
    if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes(":")) {
      return candidate;
    }
    return "/";
  };

  const onSubmit = async (data: LoginFormData) => {
    setRootError(null);
    try {
      const response = await login(data);
      const user = response.user;

      if (!user.isEmailVerified) {
        router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
        return;
      }

      const target = getSafeNextPath(nextPath);
      router.push(target);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setRootError("Too many login attempts. Please wait a few minutes and try again.");
          return;
        }

        if (err.statusCode === 403 && err.message.toLowerCase().includes("suspend")) {
          setRootError("This account has been suspended. Please contact support.");
          return;
        }

        if (err.statusCode === 401) {
          setRootError("Invalid email/phone or password. Please check your credentials.");
          return;
        }

        setRootError(err.message || "Failed to sign in. Please try again.");
      } else {
        setRootError("Unable to connect to the server. Please check your connection.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Access your vehicles, bookings and daily rental schedule.
        </p>
      </div>

      {rootError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)">
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          label="Email or mobile number"
          htmlFor="emailOrPhone"
          required
          error={errors.emailOrPhone?.message}
        >
          <Input
            id="emailOrPhone"
            placeholder="e.g. partner@example.com or 9876543210"
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
            placeholder="Enter your password"
            hasError={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-(--brand) hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-(--line) text-center text-sm text-(--ink-soft)">
        Don&apos;t have a partner account?{" "}
        <Link href="/register" className="font-medium text-(--brand) hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-(--ink-soft)">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
