"use client";

import React, { useState, useRef } from "react";
import { Container } from "@/components/layout/container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  updateProfile,
  updateAvatar,
  updateNotificationPreferences,
  changePassword,
} from "@/lib/api/profile";
import type { User } from "@/types/auth";

interface ProfileContentProps {
  user: User;
  refreshUser: () => unknown;
  logout: () => unknown;
  isLoggingOut: boolean;
}

function ProfileContent({
  user,
  refreshUser,
  logout,
  isLoggingOut,
}: ProfileContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State initialized directly from user prop
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Preferences State
  const [inApp, setInApp] = useState(user.notificationPreferences?.inApp ?? true);
  const [emailPref, setEmailPref] = useState(
    user.notificationPreferences?.email ?? true
  );
  const [pushPref, setPushPref] = useState(
    user.notificationPreferences?.push ?? false
  );
  const [prefsSuccess, setPrefsSuccess] = useState<string | null>(null);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      await refreshUser();
      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to update profile."
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar image must be under 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Avatar must be a JPG, PNG, or WebP image.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setIsUploadingAvatar(true);

    try {
      await updateAvatar(file);
      await refreshUser();
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Failed to upload avatar."
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsSuccess(null);
    setIsUpdatingPrefs(true);

    try {
      await updateNotificationPreferences({
        inApp,
        email: emailPref,
        push: pushPref,
      });
      await refreshUser();
      setPrefsSuccess("Preferences saved.");
    } catch {
      // Ignore preferences error
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!regex.test(newPassword)) {
      setPasswordError(
        "New password must be at least 8 characters long and contain at least one letter and one number."
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess("Password changed successfully.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const activeAvatarUrl = avatarPreview || user.avatar?.url;

  return (
    <div className="py-8 sm:py-12">
      <Container size="default">
        <header className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your personal profile, notification preferences, and security.
          </p>
        </header>

        <div className="max-w-2xl space-y-8">
          {/* Personal Information */}
          <section className="rounded-lg border border-line bg-paper-card p-6">
            <h2 className="font-serif text-lg font-bold text-ink mb-4">
              Personal Information
            </h2>

            {/* Avatar Row */}
            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-line">
              <Avatar
                src={activeAvatarUrl}
                name={user.fullName}
                size="lg"
                className="h-16 w-16 text-lg border border-line"
              />

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFile}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploadingAvatar}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingAvatar}
                >
                  Change Photo
                </Button>
                <p className="mt-1 text-[11px] text-ink-muted">
                  JPG, PNG, or WebP. Max 5 MB.
                </p>
                {avatarError && (
                  <p className="mt-1 text-xs text-rose-700">{avatarError}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Field label="Full Name" htmlFor="profile-fullname" required>
                <Input
                  id="profile-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isUpdatingProfile}
                />
              </Field>

              <Field label="Email Address" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  value={user.email}
                  disabled
                  readOnly
                  className="bg-paper-light text-ink-muted cursor-not-allowed"
                />
                <span className="text-[11px] text-ink-muted mt-1">
                  Email cannot be changed directly. Contact support if you need assistance.
                </span>
              </Field>

              <Field label="Phone Number" htmlFor="profile-phone" required>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isUpdatingProfile}
                />
              </Field>

              {/* Required advisory notice from prompt */}
              <div className="rounded-md border border-line bg-paper-light p-3 text-xs text-ink-muted">
                <strong className="font-semibold text-ink">Please note: </strong>
                Changing your phone number requires re-confirmation by our support team, and resets confirmation until verified.
              </div>

              {profileSuccess && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {profileError}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingProfile}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </section>

          {/* Notification Preferences */}
          <section className="rounded-lg border border-line bg-paper-card p-6">
            <h2 className="font-serif text-lg font-bold text-ink mb-1">
              Notification Preferences
            </h2>
            <p className="text-xs text-ink-muted mb-4">
              Choose how you want to be notified about bookings and account activity.
            </p>

            {/* Critical alert reminder requirement */}
            <div className="rounded-md border border-brand/20 bg-brand-tint p-3 text-xs text-brand-dark mb-4">
              Alerts about your bookings are always sent for critical events.
            </div>

            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3.5 cursor-pointer">
                <Checkbox
                  checked={inApp}
                  onChange={(e) => setInApp(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="text-sm">
                  <span className="font-semibold text-ink">In-App Notifications</span>
                  <p className="text-xs text-ink-muted">
                    Display notification badges and alerts inside Trip Wheels.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3.5 cursor-pointer">
                <Checkbox
                  checked={emailPref}
                  onChange={(e) => setEmailPref(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="text-sm">
                  <span className="font-semibold text-ink">Email Notifications</span>
                  <p className="text-xs text-ink-muted">
                    Receive confirmation receipts, owner response alerts, and reminders via email.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3.5 cursor-pointer">
                <Checkbox
                  checked={pushPref}
                  onChange={(e) => setPushPref(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="text-sm">
                  <span className="font-semibold text-ink">Push Notifications</span>
                  <p className="text-xs text-ink-muted">
                    Receive device notifications when owners reply or update your trip.
                  </p>
                </div>
              </label>

              {prefsSuccess && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  {prefsSuccess}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingPrefs}
                >
                  Save Preferences
                </Button>
              </div>
            </form>
          </section>

          {/* Change Password */}
          <section className="rounded-lg border border-line bg-paper-card p-6">
            <h2 className="font-serif text-lg font-bold text-ink mb-1">
              Change Password
            </h2>
            <p className="text-xs text-ink-muted mb-4">
              Keep your account secure by choosing a strong password.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Field label="Current Password" htmlFor="current-pw" required>
                <Input
                  id="current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                />
              </Field>

              <Field label="New Password" htmlFor="new-pw" required>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                />
                <span className="text-[11px] text-ink-muted mt-1">
                  At least 8 characters with at least one letter and one number.
                </span>
              </Field>

              {passwordSuccess && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                  {passwordError}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </section>

          {/* Sign Out */}
          <section className="rounded-lg border border-line bg-paper-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-serif text-base font-bold text-ink">
                Sign Out
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                End your active session on this browser.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => logout()}
              isLoading={isLoggingOut}
            >
              Sign out of account
            </Button>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser, logout, isLoggingOut, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="py-8 sm:py-12">
        <Container size="default">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full max-w-2xl" />
        </Container>
      </div>
    );
  }

  return (
    <ProfileContent
      key={user._id}
      user={user}
      refreshUser={refreshUser}
      logout={logout}
      isLoggingOut={isLoggingOut}
    />
  );
}
