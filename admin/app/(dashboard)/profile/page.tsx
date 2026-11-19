"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ExternalLink,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import {
  changePassword,
  updateNotificationPreferences,
  updateUserProfile,
  uploadAvatar,
} from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import {
  getPushPermissionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { isIosSafari } from "@/lib/pwa";

export default function ProfilePage() {
  const { user, logout, isLoggingOut } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Basic info form state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar?.url || null
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification preferences state
  const [inAppNotif, setInAppNotif] = useState(
    user?.notificationPreferences?.inApp ?? true
  );
  const [emailNotif, setEmailNotif] = useState(
    user?.notificationPreferences?.email ?? true
  );
  const [pushNotif, setPushNotif] = useState(
    user?.notificationPreferences?.push ?? true
  );
  const [pushPermission, setPushPermission] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");
  const [isIos, setIsIos] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPushPermission(getPushPermissionState());
      setIsIos(isIosSafari());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update profile mutation
  const profileMutation = useMutation({
    mutationFn: async () => {
      setProfileError(null);
      setProfileMessage(null);
      if (!fullName.trim() || fullName.trim().length < 2) {
        throw new Error("Full name must be at least 2 characters.");
      }
      return updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.auth.me, updatedUser);
      showToast("Profile details updated successfully.", "brand");
      setProfileMessage("Your profile information has been saved.");
    },
    onError: (err: Error) => {
      setProfileError(err.message || "Failed to update profile");
    },
  });

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      setAvatarError(null);
      const formData = new FormData();
      formData.append("avatar", file);
      return uploadAvatar(formData);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.auth.me, updatedUser);
      showToast("Profile avatar updated.", "brand");
    },
    onError: (err: Error) => {
      setAvatarError(err.message || "Failed to upload avatar");
    },
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar image must be smaller than 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Avatar must be a JPG, PNG, or WebP image.");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    avatarMutation.mutate(file);
  };

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      setPasswordError(null);
      setPasswordMessage(null);
      if (!currentPassword) {
        throw new Error("Please enter your current password.");
      }
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      return changePassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      showToast("Password changed successfully.", "brand");
      setPasswordMessage("Your password has been updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      setPasswordError(err.message || "Failed to change password");
    },
  });

  // Notification preferences mutation
  const prefMutation = useMutation({
    mutationFn: async (newPrefs: { inApp?: boolean; email?: boolean; push?: boolean }) => {
      setPrefError(null);
      setPrefMessage(null);
      return updateNotificationPreferences(newPrefs);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.auth.me, updatedUser);
      showToast("Notification preferences saved.", "brand");
      setPrefMessage("Preferences updated.");
    },
    onError: (err: Error) => {
      setPrefError(err.message || "Failed to save preferences");
    },
  });

  const handlePrefToggle = (field: "inApp" | "email", nextVal: boolean) => {
    if (field === "inApp") setInAppNotif(nextVal);
    if (field === "email") setEmailNotif(nextVal);

    prefMutation.mutate({ [field]: nextVal });
  };

  const handlePushToggle = async (nextVal: boolean) => {
    setPrefError(null);
    setPrefMessage(null);

    if (!isPushSupported()) {
      setPrefError("Push notifications are not supported on this browser.");
      return;
    }

    setIsPushLoading(true);

    if (nextVal) {
      try {
        await subscribeToPush();
        setPushNotif(true);
        setPushPermission("granted");
        prefMutation.mutate({ push: true });
        showToast("Push notifications turned on.", "brand");
      } catch (err) {
        setPushPermission(getPushPermissionState());
        setPushNotif(false);
        setPrefError(
          err instanceof Error
            ? err.message
            : "Failed to enable push notifications."
        );
      } finally {
        setIsPushLoading(false);
      }
    } else {
      try {
        await unsubscribeFromPush();
        setPushNotif(false);
        prefMutation.mutate({ push: false });
        showToast("Push notifications turned off.", "neutral");
      } catch (err) {
        setPrefError(
          err instanceof Error
            ? err.message
            : "Failed to unsubscribe from push."
        );
      } finally {
        setIsPushLoading(false);
      }
    }
  };

  return (
    <AppShell
      title="Account Settings"
      subtitle="Manage your personal details, credentials, and notification settings"
    >
      <div className="space-y-6 max-w-3xl">
        {/* Avatar and Basic Details */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-6">
          <h2 className="text-base font-semibold text-(--ink) pb-3 border-b border-(--line)">
            Profile Information
          </h2>

          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 rounded-full border border-(--line) bg-(--surface-soft) overflow-hidden shrink-0 flex items-center justify-center">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-(--ink-soft)" />
              )}
            </div>

            <div className="space-y-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-(--line) text-xs font-medium text-(--ink) hover:bg-(--surface-soft) cursor-pointer transition-colors">
                <Camera className="w-3.5 h-3.5 text-(--ink-soft)" />
                <span>
                  {avatarMutation.isPending ? "Uploading..." : "Change avatar"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  disabled={avatarMutation.isPending}
                />
              </label>
              <p className="text-[11px] text-(--ink-soft)">
                JPG, PNG or WebP up to 5 MB
              </p>
              {avatarError && (
                <p className="text-xs text-rose-700">{avatarError}</p>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              profileMutation.mutate();
            }}
            className="space-y-4 pt-2"
          >
            {profileError && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            {profileMessage && (
              <div className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{profileMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Full name *
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Email address
              </label>
              <Input value={user?.email || ""} disabled className="opacity-70" />
              <p className="text-[11px] text-(--ink-soft) mt-1">
                Your email is used for account authentication and cannot be changed here.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                Contact phone number *
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-[11px] text-(--ink-soft) mt-1">
                Note: Changing your primary phone number requires re-verification by our verification team.
              </p>
            </div>

            <Button
              type="submit"
              disabled={profileMutation.isPending}
              className="bg-(--brand) hover:bg-(--brand-hover) text-white"
            >
              {profileMutation.isPending ? "Saving..." : "Save profile changes"}
            </Button>
          </form>
        </section>

        {/* Business details and pickup location link */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-(--line)">
            <div>
              <h2 className="text-base font-semibold text-(--ink)">
                Business Details & Pickup Area
              </h2>
              <p className="text-xs text-(--ink-soft) mt-0.5">
                GST number, business name, and registered pickup location.
              </p>
            </div>
            <Link
              href="/verification/profile"
              className="text-xs font-semibold text-(--brand) hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Edit business profile
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-(--ink-soft)">
            Changes to your business location, approximate service area, or tax details may require a new review by the verification team before taking effect.
          </p>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-4">
          <div className="pb-3 border-b border-(--line)">
            <h2 className="text-base font-semibold text-(--ink)">
              Notification Preferences
            </h2>
            <p className="text-xs text-(--ink-soft) mt-0.5">
              Choose how you receive alerts and reminders from Trip Wheels.
            </p>
          </div>

          <div className="rounded border border-(--line) bg-(--surface-soft) p-3 text-xs text-(--ink-soft)">
            Alerts about new booking requests and vehicle confirmations are critical and always sent.
          </div>

          {prefError && <p className="text-xs text-rose-700">{prefError}</p>}
          {prefMessage && (
            <p className="text-xs text-emerald-700">{prefMessage}</p>
          )}

          <div className="space-y-4 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={inAppNotif}
                onChange={(e) => handlePrefToggle("inApp", e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <span className="font-medium text-(--ink) block">
                  In-app notifications
                </span>
                <span className="text-(--ink-soft)">
                  Show alerts in the dashboard top bar and notifications inbox.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={emailNotif}
                onChange={(e) => handlePrefToggle("email", e.target.checked)}
                className="mt-0.5"
              />
              <div className="text-xs">
                <span className="font-medium text-(--ink) block">
                  Email notifications
                </span>
                <span className="text-(--ink-soft)">
                  Receive request summaries, verification updates, and insurance alerts by email.
                </span>
              </div>
            </label>

            <div className="rounded border border-(--line) bg-(--surface-soft)/40 p-3 space-y-2">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={pushNotif && pushPermission === "granted"}
                    onChange={(e) => handlePushToggle(e.target.checked)}
                    disabled={isPushLoading || pushPermission === "unsupported" || pushPermission === "denied"}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-(--ink) block">
                      Push notifications {isPushLoading ? "(Updating...)" : ""}
                    </span>
                    <span className="text-(--ink-soft)">
                      We will alert you when a customer sends a request, when you need to confirm a vehicle, and when something changes on a trip.
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {pushPermission === "unsupported" ? (
                    <Badge tone="neutral">Not supported</Badge>
                  ) : pushPermission === "denied" ? (
                    <Badge tone="negative">Blocked in browser</Badge>
                  ) : pushPermission === "granted" && pushNotif ? (
                    <Badge tone="brand">Active</Badge>
                  ) : (
                    <Badge tone="neutral">Off</Badge>
                  )}
                </div>
              </label>

              {pushPermission === "denied" && (
                <p className="text-xs text-rose-700 pl-7">
                  Notifications are blocked in your browser settings. To receive alerts, please enable notification permission for this site in your browser or phone settings.
                </p>
              )}

              {isIos && pushPermission !== "granted" && (
                <p className="text-xs text-(--ink-soft) pl-7">
                  On iPhone, push alerts work after adding Trip Wheels to your Home Screen via Safari (Share &gt; Add to Home Screen).
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 space-y-4">
          <div className="pb-3 border-b border-(--line)">
            <h2 className="text-base font-semibold text-(--ink)">
              Change Password
            </h2>
            <p className="text-xs text-(--ink-soft) mt-0.5">
              Update your password to keep your account secure.
            </p>
          </div>

          {user?.hasPassword === false ? (
            <p className="text-sm text-(--ink-soft)">
              You signed in with Google. To add a password, use{" "}
              <Link
                href="/forgot-password"
                className="font-medium text-(--brand) hover:underline"
              >
                Reset password
              </Link>
              .
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                passwordMutation.mutate();
              }}
              className="space-y-4"
            >
              {passwordError && (
                <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordMessage && (
                <div className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                  Current password *
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                    New password *
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-(--ink-soft) mb-1">
                    Confirm new password *
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={passwordMutation.isPending}
                className="bg-(--brand) hover:bg-(--brand-hover) text-white"
              >
                {passwordMutation.isPending ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </section>

        {/* Sign Out Section */}
        <section className="rounded-md border border-(--line) bg-(--surface) p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-(--ink)">Sign out</h2>
            <p className="text-xs text-(--ink-soft) mt-0.5">
              End your active session on this device.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
