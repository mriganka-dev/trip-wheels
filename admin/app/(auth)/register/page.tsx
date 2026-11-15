"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const registerSchema = z
  .object({
    role: z.enum(["agent", "individual"], {
      message: "Please choose your owner type",
    }),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters"),
    email: z.string().trim().email("Enter a valid email address").toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    password: z
      .string()
      .regex(
        passwordRegex,
        "Password must be at least 8 characters and contain at least one letter and one number"
      ),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"agent" | "individual">("agent");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "agent",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setRootError(null);
    try {
      const cleanPhone = data.phone.replace(/\D/g, "");
      const formattedPhone = `91${cleanPhone}`;

      await registerUser({
        role: data.role,
        fullName: data.fullName,
        email: data.email,
        phone: formattedPhone,
        password: data.password,
      });

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setRootError("Too many attempts. Please wait a short while and try again.");
          return;
        }

        if (err.errors && err.errors.length > 0) {
          err.errors.forEach((fieldErr) => {
            if (fieldErr.field && fieldErr.field in data) {
              setError(fieldErr.field as keyof RegisterFormData, {
                message: fieldErr.message,
              });
            }
          });
          return;
        }

        setRootError(err.message || "Registration failed. Please check your details.");
      } else {
        setRootError("Unable to connect to the server. Please check your network.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold font-display text-(--ink)">
          Create your partner account
        </h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          List your vehicles and accept direct booking requests from travelers.
        </p>
      </div>

      {rootError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-(--negative)">
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Owner type radio options */}
        <Field label="Owner type" required error={errors.role?.message}>
          <RadioGroup
            name="role"
            value={selectedRole}
            onChange={(val) => {
              const roleVal = val as "agent" | "individual";
              setSelectedRole(roleVal);
              setValue("role", roleVal, { shouldValidate: true });
            }}
            options={[
              {
                value: "agent",
                label: "Agent",
                hint: "I run a rental shop or business with several vehicles.",
              },
              {
                value: "individual",
                label: "Individual",
                hint: "I rent out my own vehicle, up to 2 vehicles.",
              },
            ]}
          />
        </Field>

        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={errors.fullName?.message}
        >
          <Input
            id="fullName"
            placeholder="e.g. Ramesh Patel"
            hasError={Boolean(errors.fullName)}
            {...register("fullName")}
          />
        </Field>

        <Field
          label="Email address"
          htmlFor="email"
          required
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="e.g. ramesh@example.com"
            hasError={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor="phone"
          required
          hint="10-digit Indian mobile number"
          error={errors.phone?.message}
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center px-3 text-sm font-medium border border-(--line) bg-(--paper) rounded-md text-(--ink-soft) min-h-[44px]">
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="98765 43210"
              maxLength={10}
              hasError={Boolean(errors.phone)}
              {...register("phone")}
            />
          </div>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 8 characters with a letter and a number"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            hasError={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
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
            Create partner account
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-(--line) text-center text-sm text-(--ink-soft)">
        Already have a partner account?{" "}
        <Link href="/login" className="font-medium text-(--brand) hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
