"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const profileDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
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

type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar, changePassword, logout } = useAuth();
  const { showToast } = useToast();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    formState: { errors: detailsErrors, isSubmitting: isSubmittingDetails },
  } = useForm<ProfileDetailsFormData>({
    resolver: zodResolver(profileDetailsSchema),
    values: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Please select a JPG, PNG, or WebP image", "negative");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5 MB", "negative");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      await uploadAvatar(formData);
      showToast("Avatar updated successfully", "brand");
      setAvatarFile(null);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to upload avatar";
      showToast(message, "negative");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onUpdateDetails = async (data: ProfileDetailsFormData) => {
    try {
      await updateProfile(data);
      showToast("Profile details updated", "brand");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to update profile";
      showToast(message, "negative");
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setPasswordError(null);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showToast("Password changed successfully", "brand");
      resetPasswordForm();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setPasswordError(err.message || "Failed to change password");
      } else {
        setPasswordError("Failed to connect to the server");
      }
    }
  };

  return (
    <AppShell
      title="Your profile"
      userName={user?.fullName || "Admin"}
      contextLine="Manage your team profile, security credentials, and session."
    >
      <div className="space-y-8 max-w-2xl">
        {/* Section 1: Avatar and Account Overview */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="text-base font-semibold text-ink border-b border-line pb-3 mb-6">
            Account Profile
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-line">
            <InitialsAvatar
              name={user?.fullName || "Admin"}
              src={avatarPreview || user?.avatar?.url}
              size="lg"
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded border border-line bg-surface text-ink hover:bg-brand-tint cursor-pointer">
                  <span>Change photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarSelect}
                    disabled={isUploadingAvatar}
                  />
                </label>
                {avatarFile && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSaveAvatar}
                    isLoading={isUploadingAvatar}
                  >
                    Save photo
                  </Button>
                )}
              </div>
              <span className="text-xs text-ink-soft">
                JPG, PNG or WebP under 5 MB.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitDetails(onUpdateDetails)} className="mt-6 space-y-4">
            <Field
              label="Full name"
              htmlFor="fullName"
              error={detailsErrors.fullName?.message}
            >
              <Input
                id="fullName"
                hasError={Boolean(detailsErrors.fullName)}
                disabled={isSubmittingDetails}
                {...registerDetails("fullName")}
              />
            </Field>

            <Field label="Email address" hint="Admin email addresses are managed centrally">
              <Input value={user?.email || ""} disabled readOnly />
            </Field>

            <Field
              label="Phone number"
              htmlFor="phone"
              error={detailsErrors.phone?.message}
            >
              <Input
                id="phone"
                hasError={Boolean(detailsErrors.phone)}
                disabled={isSubmittingDetails}
                {...registerDetails("phone")}
              />
            </Field>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingDetails}
              >
                Save changes
              </Button>
            </div>
          </form>

          {user?.lastLoginAt && (
            <div className="mt-6 pt-4 border-t border-line text-xs text-ink-soft flex items-center justify-between">
              <span>Last sign in</span>
              <span className="font-medium text-ink">
                {formatDateTime(user.lastLoginAt)}
              </span>
            </div>
          )}
        </section>

        {/* Section 2: Change Password */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="text-base font-semibold text-ink border-b border-line pb-3 mb-4">
            Security & Password
          </h2>

          {passwordError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded bg-[#FDF0EF] border border-negative/30 text-xs text-negative font-medium"
            >
              {passwordError}
            </div>
          )}

          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
            <Field
              label="Current password"
              htmlFor="currentPassword"
              error={passwordErrors.currentPassword?.message}
            >
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                hasError={Boolean(passwordErrors.currentPassword)}
                disabled={isSubmittingPassword}
                {...registerPassword("currentPassword")}
              />
            </Field>

            <Field
              label="New password"
              htmlFor="newPassword"
              error={passwordErrors.newPassword?.message}
              hint="Minimum 8 characters with at least one letter and one number"
            >
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                hasError={Boolean(passwordErrors.newPassword)}
                disabled={isSubmittingPassword}
                {...registerPassword("newPassword")}
              />
            </Field>

            <Field
              label="Confirm new password"
              htmlFor="confirmPassword"
              error={passwordErrors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                hasError={Boolean(passwordErrors.confirmPassword)}
                disabled={isSubmittingPassword}
                {...registerPassword("confirmPassword")}
              />
            </Field>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingPassword}
              >
                Update password
              </Button>
            </div>
          </form>
        </section>

        {/* Section 3: Sign Out */}
        <section className="bg-surface border border-line rounded p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Sign out of session</h3>
            <p className="text-xs text-ink-soft mt-0.5">
              End your active session on this device.
            </p>
          </div>
          <Button
            type="button"
            variant="quiet"
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
