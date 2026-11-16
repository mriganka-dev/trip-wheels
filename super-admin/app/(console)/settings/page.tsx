"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getSettings, updateSettings } from "@/lib/api/system";
import {
  DEFAULT_BUSINESS_SETTINGS,
  type PlatformSettings,
  type UpdateSettingsPayload,
} from "@/types/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";

interface FormState {
  RESPONSE_WINDOW_HOURS: string;
  MIN_BOOKING_LEAD_HOURS: string;
  MAX_ACTIVE_REQUESTS_PER_CUSTOMER: string;
  VEHICLE_CONFIRMATION_LEAD_HOURS: string;
  VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: string;
  VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: string;
  LATE_DISCLOSURE_HOURS: string;
  PRE_PICKUP_REMINDER_HOURS_BEFORE: string;
  NO_SHOW_GRACE_MINUTES: string;
  AUTO_COMPLETE_GRACE_HOURS: string;
  INDIVIDUAL_MAX_VEHICLES: string;
  OTP_EXPIRY_MINUTES: string;
  OTP_MAX_ATTEMPTS: string;
  OTP_RESEND_COOLDOWN_SECONDS: string;
  OTP_MAX_PER_HOUR: string;
  REVIEW_WINDOW_DAYS: string;
  ISSUE_WINDOW_DAYS_AFTER_COMPLETION: string;
  INSURANCE_EXPIRY_WARNING_DAYS: string;
}

const formSchema = z.object({
  RESPONSE_WINDOW_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(48, "Maximum is 48 hours"),
  MIN_BOOKING_LEAD_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(72, "Maximum is 72 hours"),
  MAX_ACTIVE_REQUESTS_PER_CUSTOMER: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 request")
    .max(20, "Maximum is 20 requests"),
  VEHICLE_CONFIRMATION_LEAD_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(72, "Maximum is 72 hours"),
  VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: z
    .array(z.number().int().min(1, "Each reminder hour must be at least 1"))
    .min(1, "At least one reminder value is required")
    .refine(
      (arr) => arr.every((val, i) => i === 0 || val < arr[i - 1]),
      "Reminder hours must be in strictly descending order (e.g. 24, 18, 14)"
    ),
  VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(48, "Maximum is 48 hours"),
  LATE_DISCLOSURE_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(72, "Maximum is 72 hours"),
  PRE_PICKUP_REMINDER_HOURS_BEFORE: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(24, "Maximum is 24 hours"),
  NO_SHOW_GRACE_MINUTES: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(15, "Minimum is 15 minutes")
    .max(360, "Maximum is 360 minutes"),
  AUTO_COMPLETE_GRACE_HOURS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 hour")
    .max(48, "Maximum is 48 hours"),
  INDIVIDUAL_MAX_VEHICLES: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 vehicle")
    .max(10, "Maximum is 10 vehicles"),
  OTP_EXPIRY_MINUTES: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 minute")
    .max(60, "Maximum is 60 minutes"),
  OTP_MAX_ATTEMPTS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 attempt")
    .max(10, "Maximum is 10 attempts"),
  OTP_RESEND_COOLDOWN_SECONDS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(10, "Minimum is 10 seconds")
    .max(300, "Maximum is 300 seconds"),
  OTP_MAX_PER_HOUR: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 code")
    .max(20, "Maximum is 20 codes"),
  REVIEW_WINDOW_DAYS: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 day")
    .max(90, "Maximum is 90 days"),
  ISSUE_WINDOW_DAYS_AFTER_COMPLETION: z
    .number({ message: "Must be a valid number" })
    .int("Must be a whole number")
    .min(1, "Minimum is 1 day")
    .max(90, "Maximum is 90 days"),
  INSURANCE_EXPIRY_WARNING_DAYS: z
    .array(z.number().int().min(1, "Each warning day must be at least 1"))
    .min(1, "At least one warning day is required")
    .refine(
      (arr) => arr.every((val, i) => i === 0 || val < arr[i - 1]),
      "Warning days must be in strictly descending order (e.g. 30, 7, 1)"
    ),
});

interface ChangedField {
  key: keyof UpdateSettingsPayload;
  label: string;
  unit: string;
  oldValueText: string;
  newValueText: string;
  parsedValue: unknown;
}

function getInitialFormState(settings: PlatformSettings): FormState {
  return {
    RESPONSE_WINDOW_HOURS: String(settings.RESPONSE_WINDOW_HOURS ?? ""),
    MIN_BOOKING_LEAD_HOURS: String(settings.MIN_BOOKING_LEAD_HOURS ?? ""),
    MAX_ACTIVE_REQUESTS_PER_CUSTOMER: String(
      settings.MAX_ACTIVE_REQUESTS_PER_CUSTOMER ?? ""
    ),
    VEHICLE_CONFIRMATION_LEAD_HOURS: String(
      settings.VEHICLE_CONFIRMATION_LEAD_HOURS ?? ""
    ),
    VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: Array.isArray(
      settings.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE
    )
      ? settings.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE.join(", ")
      : "",
    VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: String(
      settings.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE ?? ""
    ),
    LATE_DISCLOSURE_HOURS: String(settings.LATE_DISCLOSURE_HOURS ?? ""),
    PRE_PICKUP_REMINDER_HOURS_BEFORE: String(
      settings.PRE_PICKUP_REMINDER_HOURS_BEFORE ?? ""
    ),
    NO_SHOW_GRACE_MINUTES: String(settings.NO_SHOW_GRACE_MINUTES ?? ""),
    AUTO_COMPLETE_GRACE_HOURS: String(settings.AUTO_COMPLETE_GRACE_HOURS ?? ""),
    INDIVIDUAL_MAX_VEHICLES: String(settings.INDIVIDUAL_MAX_VEHICLES ?? ""),
    OTP_EXPIRY_MINUTES: String(settings.OTP_EXPIRY_MINUTES ?? ""),
    OTP_MAX_ATTEMPTS: String(settings.OTP_MAX_ATTEMPTS ?? ""),
    OTP_RESEND_COOLDOWN_SECONDS: String(
      settings.OTP_RESEND_COOLDOWN_SECONDS ?? ""
    ),
    OTP_MAX_PER_HOUR: String(settings.OTP_MAX_PER_HOUR ?? ""),
    REVIEW_WINDOW_DAYS: String(settings.REVIEW_WINDOW_DAYS ?? ""),
    ISSUE_WINDOW_DAYS_AFTER_COMPLETION: String(
      settings.ISSUE_WINDOW_DAYS_AFTER_COMPLETION ?? ""
    ),
    INSURANCE_EXPIRY_WARNING_DAYS: Array.isArray(
      settings.INSURANCE_EXPIRY_WARNING_DAYS
    )
      ? settings.INSURANCE_EXPIRY_WARNING_DAYS.join(", ")
      : "",
  };
}

export default function SettingsPage() {
  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getSettings,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Business settings</h1>
          <p className="text-sm text-ink-soft mt-1">Loading platform configuration parameters...</p>
        </div>
        <div className="bg-surface border border-line rounded p-8 text-center text-sm text-ink-soft">
          Loading platform settings...
        </div>
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Business settings</h1>
          <p className="text-sm text-ink-soft mt-1">Error loading platform configuration.</p>
        </div>
        <div className="bg-surface border border-line rounded p-8 text-center text-sm text-ink-soft space-y-3">
          <p className="text-negative font-medium">Failed to load platform settings from server.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const settingsKey = settings.updatedAt || settings._id || "settings-loaded";

  return <SettingsEditor key={settingsKey} settings={settings} />;
}

function SettingsEditor({ settings }: { settings: PlatformSettings }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [formValues, setFormValues] = useState<FormState>(() =>
    getInitialFormState(settings)
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleFieldChange = (key: keyof FormState, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleReset = () => {
    setFormValues(getInitialFormState(settings));
    setErrors({});
  };

  const parseNumberList = (str: string): number[] => {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s));
  };

  // Compute changed fields
  const diffs: ChangedField[] = useMemo(() => {
    const list: ChangedField[] = [];

    const checkNumberField = (
      key: keyof UpdateSettingsPayload,
      label: string,
      unit: string
    ) => {
      const currentVal = settings[key] as number;
      const rawVal = formValues[key as keyof FormState];
      const parsedVal = Number(rawVal);
      if (rawVal !== "" && !Number.isNaN(parsedVal) && parsedVal !== currentVal) {
        list.push({
          key,
          label,
          unit,
          oldValueText: `${currentVal} ${unit}`,
          newValueText: `${parsedVal} ${unit}`,
          parsedValue: parsedVal,
        });
      }
    };

    const checkArrayField = (
      key: "VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE" | "INSURANCE_EXPIRY_WARNING_DAYS",
      label: string,
      unit: string
    ) => {
      const currentArr = (settings[key] as number[]) || [];
      const parsedArr = parseNumberList(formValues[key]);
      const isDifferent =
        currentArr.length !== parsedArr.length ||
        currentArr.some((val, idx) => val !== parsedArr[idx]);

      if (isDifferent && parsedArr.length > 0 && !parsedArr.some(Number.isNaN)) {
        list.push({
          key,
          label,
          unit,
          oldValueText: currentArr.join(", "),
          newValueText: parsedArr.join(", "),
          parsedValue: parsedArr,
        });
      }
    };

    checkNumberField("RESPONSE_WINDOW_HOURS", "Response window", "hours");
    checkNumberField("MIN_BOOKING_LEAD_HOURS", "Minimum booking lead time", "hours");
    checkNumberField(
      "MAX_ACTIVE_REQUESTS_PER_CUSTOMER",
      "Maximum active requests per customer",
      "requests"
    );
    checkNumberField(
      "VEHICLE_CONFIRMATION_LEAD_HOURS",
      "Vehicle confirmation lead time",
      "hours"
    );
    checkArrayField(
      "VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE",
      "Vehicle confirmation reminders",
      "hours"
    );
    checkNumberField(
      "VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE",
      "Vehicle confirmation deadline",
      "hours"
    );
    checkNumberField("LATE_DISCLOSURE_HOURS", "Late disclosure window", "hours");
    checkNumberField(
      "PRE_PICKUP_REMINDER_HOURS_BEFORE",
      "Pre-pickup reminder",
      "hours"
    );
    checkNumberField("NO_SHOW_GRACE_MINUTES", "No-show grace period", "minutes");
    checkNumberField(
      "AUTO_COMPLETE_GRACE_HOURS",
      "Auto-complete grace period",
      "hours"
    );
    checkNumberField(
      "INDIVIDUAL_MAX_VEHICLES",
      "Individual owner vehicle limit",
      "vehicles"
    );
    checkNumberField("OTP_EXPIRY_MINUTES", "OTP validity duration", "minutes");
    checkNumberField("OTP_MAX_ATTEMPTS", "OTP maximum attempts", "attempts");
    checkNumberField(
      "OTP_RESEND_COOLDOWN_SECONDS",
      "OTP resend cooldown",
      "seconds"
    );
    checkNumberField("OTP_MAX_PER_HOUR", "OTP hourly limit", "codes");
    checkNumberField("REVIEW_WINDOW_DAYS", "Review submission window", "days");
    checkNumberField(
      "ISSUE_WINDOW_DAYS_AFTER_COMPLETION",
      "Issue reporting window",
      "days"
    );
    checkArrayField(
      "INSURANCE_EXPIRY_WARNING_DAYS",
      "Insurance expiry warning days",
      "days"
    );

    return list;
  }, [settings, formValues]);

  // Open confirmation
  const handleOpenConfirm = () => {
    const rawParsed: Record<string, unknown> = {};

    // Parse all fields to validate with zod
    for (const [key, val] of Object.entries(formValues)) {
      if (
        key === "VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE" ||
        key === "INSURANCE_EXPIRY_WARNING_DAYS"
      ) {
        rawParsed[key] = parseNumberList(val as string);
      } else {
        rawParsed[key] = val === "" ? undefined : Number(val);
      }
    }

    const result = formSchema.safeParse(rawParsed);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const fieldKey = issue.path[0] as keyof FormState;
        if (fieldKey && !fieldErrors[fieldKey]) {
          fieldErrors[fieldKey] = issue.message;
        }
      }
      setErrors(fieldErrors);
      showToast("Please check invalid input fields", "negative");
      return;
    }

    setErrors({});
    setAdminNote("");
    setDialogError(null);
    setConfirmOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "settings"], updated);
      showToast("Platform settings updated successfully", "brand");
      setConfirmOpen(false);
      setAdminNote("");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors && err.errors.length > 0) {
        const serverErrors: Partial<Record<keyof FormState, string>> = {};
        for (const item of err.errors) {
          if (item.field && item.field in formValues) {
            serverErrors[item.field as keyof FormState] = item.message;
          }
        }
        setErrors(serverErrors);
      }
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      setDialogError(msg);
      showToast(msg, "negative");
    },
  });

  const handleConfirmSave = async () => {
    if (adminNote.trim().length === 0) {
      setDialogError("An admin note is required for this action");
      return;
    }

    setDialogError(null);
    const payload: UpdateSettingsPayload = {};
    for (const diff of diffs) {
      // @ts-expect-error key is guaranteed safe
      payload[diff.key] = diff.parsedValue;
    }

    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header with sticky save bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Business settings</h1>
          <p className="text-sm text-ink-soft mt-1">
            Tune platform rules, response windows, confirmation thresholds, and grace periods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {diffs.length > 0 && (
            <Badge tone="warning">
              {diffs.length} unsaved change{diffs.length === 1 ? "" : "s"}
            </Badge>
          )}

          <Button
            variant="quiet"
            onClick={handleReset}
            disabled={diffs.length === 0 || updateMutation.isPending}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenConfirm}
            disabled={diffs.length === 0 || updateMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </div>

      {/* Settings Form Container */}
      <div className="space-y-8">
        {/* Section 1: Booking */}
        <section className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-semibold text-ink">Booking</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Limits and response windows governing booking requests from customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingRow
              label="Response window"
              keyName="RESPONSE_WINDOW_HOURS"
              unit="hours"
              explanation="Maximum time an owner has to accept or reject a customer booking request before it expires."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.RESPONSE_WINDOW_HOURS} hours`}
              currentValue={`${settings.RESPONSE_WINDOW_HOURS} hours`}
              value={formValues.RESPONSE_WINDOW_HOURS}
              onChange={(v) => handleFieldChange("RESPONSE_WINDOW_HOURS", v)}
              error={errors.RESPONSE_WINDOW_HOURS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Minimum booking lead time"
              keyName="MIN_BOOKING_LEAD_HOURS"
              unit="hours"
              explanation="Minimum advance notice required between booking submission and trip start time."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.MIN_BOOKING_LEAD_HOURS} hours`}
              currentValue={`${settings.MIN_BOOKING_LEAD_HOURS} hours`}
              value={formValues.MIN_BOOKING_LEAD_HOURS}
              onChange={(v) => handleFieldChange("MIN_BOOKING_LEAD_HOURS", v)}
              error={errors.MIN_BOOKING_LEAD_HOURS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Maximum active requests per customer"
              keyName="MAX_ACTIVE_REQUESTS_PER_CUSTOMER"
              unit="requests"
              explanation="Limit on simultaneous pending booking requests a single customer can have active."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.MAX_ACTIVE_REQUESTS_PER_CUSTOMER} requests`}
              currentValue={`${settings.MAX_ACTIVE_REQUESTS_PER_CUSTOMER} requests`}
              value={formValues.MAX_ACTIVE_REQUESTS_PER_CUSTOMER}
              onChange={(v) =>
                handleFieldChange("MAX_ACTIVE_REQUESTS_PER_CUSTOMER", v)
              }
              error={errors.MAX_ACTIVE_REQUESTS_PER_CUSTOMER}
              disabled={updateMutation.isPending}
            />
          </div>
        </section>

        {/* Section 2: Vehicle confirmation */}
        <section className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-semibold text-ink">Vehicle confirmation</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Milestones for owners to confirm assigned vehicles, automated reminders, and late disclosure thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingRow
              label="Confirmation lead time"
              keyName="VEHICLE_CONFIRMATION_LEAD_HOURS"
              unit="hours before pickup"
              explanation="How many hours before pickup the owner is asked to confirm the specific assigned vehicle."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.VEHICLE_CONFIRMATION_LEAD_HOURS} hours`}
              currentValue={`${settings.VEHICLE_CONFIRMATION_LEAD_HOURS} hours`}
              value={formValues.VEHICLE_CONFIRMATION_LEAD_HOURS}
              onChange={(v) =>
                handleFieldChange("VEHICLE_CONFIRMATION_LEAD_HOURS", v)
              }
              error={errors.VEHICLE_CONFIRMATION_LEAD_HOURS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Confirmation deadline"
              keyName="VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE"
              unit="hours before pickup"
              explanation="Hard deadline before pickup for owner to confirm the vehicle."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE} hours`}
              currentValue={`${settings.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE} hours`}
              value={formValues.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE}
              onChange={(v) =>
                handleFieldChange(
                  "VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE",
                  v
                )
              }
              error={errors.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Vehicle confirmation reminders"
              keyName="VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE"
              unit="hours before pickup (comma-separated, descending)"
              explanation="Automated reminder intervals sent to the owner prior to the deadline."
              defaultValue={DEFAULT_BUSINESS_SETTINGS.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE.join(
                ", "
              )}
              currentValue={
                Array.isArray(settings.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE)
                  ? settings.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE.join(", ")
                  : "No data"
              }
              value={formValues.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE}
              onChange={(v) =>
                handleFieldChange(
                  "VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE",
                  v
                )
              }
              error={errors.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE}
              disabled={updateMutation.isPending}
              isText
            />

            <SettingRow
              label="Late disclosure window"
              keyName="LATE_DISCLOSURE_HOURS"
              unit="hours"
              explanation="Threshold within which an owner reporting unavailability is marked as late disclosure."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.LATE_DISCLOSURE_HOURS} hours`}
              currentValue={`${settings.LATE_DISCLOSURE_HOURS} hours`}
              value={formValues.LATE_DISCLOSURE_HOURS}
              onChange={(v) => handleFieldChange("LATE_DISCLOSURE_HOURS", v)}
              error={errors.LATE_DISCLOSURE_HOURS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Pre-pickup reminder"
              keyName="PRE_PICKUP_REMINDER_HOURS_BEFORE"
              unit="hours before pickup"
              explanation="Reminder sent to customer and owner before trip start time."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.PRE_PICKUP_REMINDER_HOURS_BEFORE} hours`}
              currentValue={`${settings.PRE_PICKUP_REMINDER_HOURS_BEFORE} hours`}
              value={formValues.PRE_PICKUP_REMINDER_HOURS_BEFORE}
              onChange={(v) =>
                handleFieldChange("PRE_PICKUP_REMINDER_HOURS_BEFORE", v)
              }
              error={errors.PRE_PICKUP_REMINDER_HOURS_BEFORE}
              disabled={updateMutation.isPending}
            />
          </div>
        </section>

        {/* Section 3: Trip */}
        <section className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-semibold text-ink">Trip</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Grace windows for customer pickup arrival and automatic completion after scheduled dropoff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingRow
              label="No-show grace period"
              keyName="NO_SHOW_GRACE_MINUTES"
              unit="minutes"
              explanation="Grace window after scheduled pickup time before a booking can be marked as customer no-show."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.NO_SHOW_GRACE_MINUTES} minutes`}
              currentValue={`${settings.NO_SHOW_GRACE_MINUTES} minutes`}
              value={formValues.NO_SHOW_GRACE_MINUTES}
              onChange={(v) => handleFieldChange("NO_SHOW_GRACE_MINUTES", v)}
              error={errors.NO_SHOW_GRACE_MINUTES}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Auto-complete grace period"
              keyName="AUTO_COMPLETE_GRACE_HOURS"
              unit="hours"
              explanation="Grace window after scheduled dropoff time before a booking is automatically marked completed."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.AUTO_COMPLETE_GRACE_HOURS} hours`}
              currentValue={`${settings.AUTO_COMPLETE_GRACE_HOURS} hours`}
              value={formValues.AUTO_COMPLETE_GRACE_HOURS}
              onChange={(v) =>
                handleFieldChange("AUTO_COMPLETE_GRACE_HOURS", v)
              }
              error={errors.AUTO_COMPLETE_GRACE_HOURS}
              disabled={updateMutation.isPending}
            />
          </div>
        </section>

        {/* Section 4: Owners */}
        <section className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-semibold text-ink">Owners</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Fleet constraints and individual owner profile limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingRow
              label="Individual owner vehicle limit"
              keyName="INDIVIDUAL_MAX_VEHICLES"
              unit="vehicles"
              explanation="Maximum number of active approved vehicles allowed for an individual owner account."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.INDIVIDUAL_MAX_VEHICLES} vehicles`}
              currentValue={`${settings.INDIVIDUAL_MAX_VEHICLES} vehicles`}
              value={formValues.INDIVIDUAL_MAX_VEHICLES}
              onChange={(v) =>
                handleFieldChange("INDIVIDUAL_MAX_VEHICLES", v)
              }
              error={errors.INDIVIDUAL_MAX_VEHICLES}
              disabled={updateMutation.isPending}
            />
          </div>
        </section>

        {/* Section 5: OTP */}
        <section className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-semibold text-ink">OTP</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Security parameters for SMS passcode verification, rate limits, and expiration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingRow
              label="OTP validity duration"
              keyName="OTP_EXPIRY_MINUTES"
              unit="minutes"
              explanation="Time before a one-time verification passcode expires."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.OTP_EXPIRY_MINUTES} minutes`}
              currentValue={`${settings.OTP_EXPIRY_MINUTES} minutes`}
              value={formValues.OTP_EXPIRY_MINUTES}
              onChange={(v) => handleFieldChange("OTP_EXPIRY_MINUTES", v)}
              error={errors.OTP_EXPIRY_MINUTES}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="OTP maximum attempts"
              keyName="OTP_MAX_ATTEMPTS"
              unit="attempts"
              explanation="Maximum invalid OTP code entry attempts before the code is invalidated."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.OTP_MAX_ATTEMPTS} attempts`}
              currentValue={`${settings.OTP_MAX_ATTEMPTS} attempts`}
              value={formValues.OTP_MAX_ATTEMPTS}
              onChange={(v) => handleFieldChange("OTP_MAX_ATTEMPTS", v)}
              error={errors.OTP_MAX_ATTEMPTS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="OTP resend cooldown"
              keyName="OTP_RESEND_COOLDOWN_SECONDS"
              unit="seconds"
              explanation="Cooldown period between OTP resend requests."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.OTP_RESEND_COOLDOWN_SECONDS} seconds`}
              currentValue={`${settings.OTP_RESEND_COOLDOWN_SECONDS} seconds`}
              value={formValues.OTP_RESEND_COOLDOWN_SECONDS}
              onChange={(v) =>
                handleFieldChange("OTP_RESEND_COOLDOWN_SECONDS", v)
              }
              error={errors.OTP_RESEND_COOLDOWN_SECONDS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="OTP hourly limit"
              keyName="OTP_MAX_PER_HOUR"
              unit="codes per hour"
              explanation="Maximum number of OTP messages a user can request per hour."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.OTP_MAX_PER_HOUR} codes`}
              currentValue={`${settings.OTP_MAX_PER_HOUR} codes`}
              value={formValues.OTP_MAX_PER_HOUR}
              onChange={(v) => handleFieldChange("OTP_MAX_PER_HOUR", v)}
              error={errors.OTP_MAX_PER_HOUR}
              disabled={updateMutation.isPending}
            />
          </div>
        </section>

        {/* Section 6: Reviews and issues */}
        <section className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-base font-semibold text-ink">Reviews and issues</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Windows for customer and owner reviews, dispute filing, and insurance watchlist warnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingRow
              label="Review submission window"
              keyName="REVIEW_WINDOW_DAYS"
              unit="days"
              explanation="Number of days after booking completion during which customer and owner can submit reviews."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.REVIEW_WINDOW_DAYS} days`}
              currentValue={`${settings.REVIEW_WINDOW_DAYS} days`}
              value={formValues.REVIEW_WINDOW_DAYS}
              onChange={(v) => handleFieldChange("REVIEW_WINDOW_DAYS", v)}
              error={errors.REVIEW_WINDOW_DAYS}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Issue reporting window"
              keyName="ISSUE_WINDOW_DAYS_AFTER_COMPLETION"
              unit="days"
              explanation="Number of days after booking completion during which an issue or complaint can be opened."
              defaultValue={`${DEFAULT_BUSINESS_SETTINGS.ISSUE_WINDOW_DAYS_AFTER_COMPLETION} days`}
              currentValue={`${settings.ISSUE_WINDOW_DAYS_AFTER_COMPLETION} days`}
              value={formValues.ISSUE_WINDOW_DAYS_AFTER_COMPLETION}
              onChange={(v) =>
                handleFieldChange("ISSUE_WINDOW_DAYS_AFTER_COMPLETION", v)
              }
              error={errors.ISSUE_WINDOW_DAYS_AFTER_COMPLETION}
              disabled={updateMutation.isPending}
            />

            <SettingRow
              label="Insurance expiry warning days"
              keyName="INSURANCE_EXPIRY_WARNING_DAYS"
              unit="days before expiry (comma-separated, descending)"
              explanation="Days before vehicle insurance expiry when alerts are triggered on watchlists."
              defaultValue={DEFAULT_BUSINESS_SETTINGS.INSURANCE_EXPIRY_WARNING_DAYS.join(
                ", "
              )}
              currentValue={
                Array.isArray(settings.INSURANCE_EXPIRY_WARNING_DAYS)
                  ? settings.INSURANCE_EXPIRY_WARNING_DAYS.join(", ")
                  : "No data"
              }
              value={formValues.INSURANCE_EXPIRY_WARNING_DAYS}
              onChange={(v) =>
                handleFieldChange("INSURANCE_EXPIRY_WARNING_DAYS", v)
              }
              error={errors.INSURANCE_EXPIRY_WARNING_DAYS}
              disabled={updateMutation.isPending}
              isText
            />
          </div>
        </section>
      </div>

      {/* Confirmation Dialog with Diff Summary and Required Admin Note */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          title="Confirm settings update"
          className="max-w-xl"
          showClose={!updateMutation.isPending}
        >
          <div className="space-y-4 text-sm">
            <p className="text-ink">
              Review the updated configuration values before applying changes to the platform:
            </p>

            {/* Diff Table */}
            <div className="border border-line rounded overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-paper border-b border-line text-ink-soft uppercase font-semibold">
                    <th className="p-2.5">Setting</th>
                    <th className="p-2.5">Current value</th>
                    <th className="p-2.5">New value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {diffs.map((d) => (
                    <tr key={String(d.key)}>
                      <td className="p-2.5 font-medium text-ink">
                        <div>{d.label}</div>
                        <div className="font-mono text-[10px] text-ink-soft">
                          {String(d.key)}
                        </div>
                      </td>
                      <td className="p-2.5 text-ink-soft">{d.oldValueText}</td>
                      <td className="p-2.5 font-semibold text-brand">
                        {d.newValueText}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Required Admin Note */}
            <Field
              label="Admin note"
              required
              error={dialogError || undefined}
              hint="Required for the audit trail"
            >
              <Textarea
                value={adminNote}
                onChange={(e) => {
                  setAdminNote(e.target.value);
                  if (dialogError) setDialogError(null);
                }}
                placeholder="Reason or operational context for updating these platform settings"
                rows={3}
                hasError={Boolean(dialogError)}
                disabled={updateMutation.isPending}
              />
            </Field>

            {/* Warning line required by specification */}
            <div className="bg-paper p-3 rounded border border-line text-xs text-ink-soft space-y-1">
              <p className="font-medium text-ink">Audit notice</p>
              <p>
                Changes apply to new activity within a short time. They are recorded in the audit log.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="quiet"
                onClick={() => setConfirmOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Applying..." : "Confirm and apply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  keyName: string;
  unit: string;
  explanation: string;
  defaultValue: string;
  currentValue: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  isText?: boolean;
}

function SettingRow({
  label,
  keyName,
  unit,
  explanation,
  defaultValue,
  currentValue,
  value,
  onChange,
  error,
  disabled,
  isText = false,
}: SettingRowProps) {
  return (
    <div className="flex flex-col justify-between p-3.5 bg-paper rounded border border-line space-y-2.5">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-sm font-semibold text-ink" htmlFor={keyName}>
            {label}
          </label>
          <span className="text-xs text-ink-soft font-mono">({unit})</span>
        </div>
        <p className="text-xs text-ink-soft mt-1 leading-normal">{explanation}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft pt-1 border-t border-line/60">
        <div>
          Current: <span className="font-medium text-ink">{currentValue}</span>
        </div>
        <div>
          Default: <span className="font-medium text-ink">{defaultValue}</span>
        </div>
      </div>

      <Field error={error}>
        <Input
          id={keyName}
          type={isText ? "text" : "number"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          hasError={Boolean(error)}
          disabled={disabled}
        />
      </Field>
    </div>
  );
}
