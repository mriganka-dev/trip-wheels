import React from "react";
import type { BookingVehicleConfirmation } from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";

interface VehicleDetailsCardProps {
  vehicle: Vehicle;
  assignedVehicle?: Vehicle;
  confirmation?: BookingVehicleConfirmation;
}

export function VehicleDetailsCard({
  vehicle,
  assignedVehicle,
  confirmation,
}: VehicleDetailsCardProps) {
  const isConfirmed = Boolean(confirmation?.confirmedAt);
  const activeVehicle = assignedVehicle || vehicle;

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Vehicle Allocation
      </span>
      <h3 className="mt-0.5 font-serif text-lg font-bold text-ink">
        {activeVehicle.brand} {activeVehicle.model} ({activeVehicle.year})
      </h3>

      {isConfirmed ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-paper-light p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Registration Number
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-ink">
                {confirmation?.registrationNumber || "On document"}
              </p>
            </div>

            <div className="rounded-md border border-line bg-paper-light p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Chassis Number
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-ink">
                {confirmation?.chassisNumber || "On document"}
              </p>
            </div>

            <div className="rounded-md border border-line bg-paper-light p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Color
              </p>
              <p className="mt-1 text-sm font-medium text-ink capitalize">
                {confirmation?.color || "Standard"}
              </p>
            </div>
          </div>

          {confirmation?.notes && (
            <div className="rounded-md border border-line bg-paper-light p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Owner Vehicle Notes
              </p>
              <p className="mt-1 text-xs text-ink leading-relaxed">
                {confirmation.notes}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-line bg-paper-light p-4">
          <div className="flex items-start gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 text-brand mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Exact Vehicle Allocation
              </p>
              <p className="mt-0.5 text-xs text-ink leading-relaxed">
                The owner confirms the exact vehicle about 24 hours before pickup. We will notify you.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

