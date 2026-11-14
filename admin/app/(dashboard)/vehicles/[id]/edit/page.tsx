"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getVehicle } from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import type { Vehicle } from "@/types/vehicle";

export default function EditVehiclePage() {
  const params = useParams();
  const { user, profile } = useAuth();

  const id = typeof params?.id === "string" ? params.id : "";

  const {
    data: vehicle,
    isLoading,
    isError,
  } = useQuery<Vehicle>({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => getVehicle(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <AppShell title="Loading vehicle..." subtitle="Fetching current vehicle data">
        <div className="flex flex-col gap-4 max-w-4xl">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !vehicle) {
    return (
      <AppShell title="Vehicle not found" subtitle="The requested vehicle could not be loaded">
        <div className="p-8 rounded-md border border-(--line) bg-(--surface) text-center max-w-md mx-auto">
          <p className="text-sm text-(--ink-soft) mb-4">
            This vehicle may have been removed or does not belong to your account.
          </p>
          <Link href="/vehicles">
            <Button variant="secondary" size="md">
              Back to vehicles
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit ${vehicle.brand} ${vehicle.model}`}
      subtitle="Update vehicle specifications, pricing, photos or registration documents."
      actions={
        <Link href={`/vehicles/${id}`}>
          <Button variant="quiet" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to vehicle details
          </Button>
        </Link>
      }
    >
      <VehicleForm
        mode="edit"
        initialVehicle={vehicle}
        user={user}
        profile={profile}
      />
    </AppShell>
  );
}
