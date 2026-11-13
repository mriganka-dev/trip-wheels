import React from "react";
import type { Vehicle } from "@/types/vehicle";
import { formatDurationHours } from "@/lib/format";

export interface VehicleSpecsProps {
  vehicle: Vehicle;
}

export function VehicleSpecs({ vehicle }: VehicleSpecsProps) {
  const specs = [
    { label: "Vehicle type", value: vehicle.type.toUpperCase() },
    { label: "Transmission", value: vehicle.transmission.toUpperCase() },
    { label: "Fuel type", value: vehicle.fuelType.toUpperCase() },
    {
      label: vehicle.type === "car" ? "Seating capacity" : "Engine capacity",
      value:
        vehicle.type === "car"
          ? vehicle.seats
            ? `${vehicle.seats} seats`
            : "5 seats"
          : vehicle.engineCapacity
          ? `${vehicle.engineCapacity} cc`
          : "Standard",
    },
    { label: "Model year", value: String(vehicle.year) },
    { label: "Color", value: vehicle.color || "Standard" },
    {
      label: "Minimum rental",
      value: formatDurationHours(vehicle.minRentalHours || 6),
    },
    {
      label: "Free cancellation",
      value: vehicle.freeCancellationHours
        ? `Up to ${vehicle.freeCancellationHours} hours before pickup`
        : "Up to 6 hours before pickup",
    },
  ];

  return (
    <div className="rounded-md border border-(--line) bg-(--surface) p-6">
      <h2 className="font-display text-lg font-bold text-(--ink) mb-4">
        Vehicle specifications
      </h2>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
        {specs.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-2 border-b border-(--line)/60"
          >
            <dt className="text-(--ink-soft) font-medium">{item.label}</dt>
            <dd className="text-(--ink) font-semibold text-right">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

