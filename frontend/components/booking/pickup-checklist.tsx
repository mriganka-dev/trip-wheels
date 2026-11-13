"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface PickupChecklistProps {
  bookingId: string;
}

interface ChecklistState {
  chassis: boolean;
  registration: boolean;
  condition: boolean;
  documents: boolean;
}

const DEFAULT_STATE: ChecklistState = {
  chassis: false,
  registration: false,
  condition: false,
  documents: false,
};

export function PickupChecklist({ bookingId }: PickupChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `tw_pickup_checklist_${bookingId}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setChecklist(JSON.parse(stored));
        }
      } catch {
        // Ignore localStorage errors
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [storageKey]);

  const handleToggle = (key: keyof ChecklistState) => {
    const updated = {
      ...checklist,
      [key]: !checklist[key],
    };
    setChecklist(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  if (!isLoaded) {
    return null;
  }

  const allChecked =
    checklist.chassis &&
    checklist.registration &&
    checklist.condition &&
    checklist.documents;

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Safety and Verification
          </span>
          <h3 className="mt-0.5 font-serif text-lg font-bold text-ink">
            Pickup Checklist
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Verify each item before accepting the keys. Your progress is saved on this device.
          </p>
        </div>
        {allChecked && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <svg
              className="h-3.5 w-3.5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Ready to accept
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3 cursor-pointer">
          <Checkbox
            checked={checklist.chassis}
            onChange={() => handleToggle("chassis")}
            className="mt-0.5"
          />
          <div className="text-sm">
            <span className="font-medium text-ink">
              Chassis number matches
            </span>
            <p className="text-xs text-ink-muted">
              Inspect the chassis stamping on the vehicle frame against the details above.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3 cursor-pointer">
          <Checkbox
            checked={checklist.registration}
            onChange={() => handleToggle("registration")}
            className="mt-0.5"
          />
          <div className="text-sm">
            <span className="font-medium text-ink">
              Registration number matches the number plate
            </span>
            <p className="text-xs text-ink-muted">
              Ensure both front and rear plates match the vehicle registration number.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3 cursor-pointer">
          <Checkbox
            checked={checklist.condition}
            onChange={() => handleToggle("condition")}
            className="mt-0.5"
          />
          <div className="text-sm">
            <span className="font-medium text-ink">
              Vehicle matches the photos and what was booked
            </span>
            <p className="text-xs text-ink-muted">
              Confirm model, make, fuel type, and exterior condition match the listing.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-md border border-line bg-paper-light p-3 cursor-pointer">
          <Checkbox
            checked={checklist.documents}
            onChange={() => handleToggle("documents")}
            className="mt-0.5"
          />
          <div className="text-sm">
            <span className="font-medium text-ink">
              I have my government ID and driving license
            </span>
            <p className="text-xs text-ink-muted">
              Physical original documents ready to present to the owner.
            </p>
          </div>
        </label>
      </div>

      {/* Warning and Report Link */}
      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 shrink-0 text-amber-700 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              If something does not match, do not accept the vehicle. Report it here.
            </p>
          </div>

          <Link href={`/bookings/${bookingId}/issue`} className="shrink-0">
            <Button size="sm" variant="secondary" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
              Report an Issue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
