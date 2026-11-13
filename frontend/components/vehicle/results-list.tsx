import React from "react";
import { VehicleListItem } from "./vehicle-list-item";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/types/vehicle";

export interface ResultsListProps {
  vehicles: Vehicle[];
  totalItems: number;
  page: number;
  totalPages: number;
  destinationName?: string;
  from?: string;
  to?: string;
  isLoading?: boolean;
  onPageChange: (newPage: number) => void;
}

export function ResultsList({
  vehicles,
  totalItems,
  page,
  totalPages,
  destinationName,
  from,
  to,
  isLoading = false,
  onPageChange,
}: ResultsListProps) {
  if (isLoading && vehicles.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-(--line)">
        <h2 className="font-display font-semibold text-base text-(--ink)">
          {totalItems} {totalItems === 1 ? "vehicle" : "vehicles"} available
          {destinationName ? ` in ${destinationName}` : ""}
        </h2>
        <span className="text-xs text-(--ink-soft)">
          Page {page} of {totalPages || 1}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {vehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle._id}
            vehicle={vehicle}
            from={from}
            to={to}
          />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

