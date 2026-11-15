"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getMyVehicles } from "@/lib/api/vehicles";
import { queryKeys } from "@/lib/query-keys";
import { INDIVIDUAL_MAX_VEHICLES } from "@/lib/constants";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import type { PaginatedVehiclesResponse } from "@/types/vehicle";

export default function NewVehiclePage() {
  const { user, profile } = useAuth();
  const isIndividual = user?.role === "individual";

  const { data: allVehiclesData, isLoading } = useQuery<PaginatedVehiclesResponse>({
    queryKey: queryKeys.vehicles.mine({ limit: 100 }),
    queryFn: () => getMyVehicles({ limit: 100 }),
    enabled: Boolean(user && isIndividual),
  });

  const totalIndividualCount = allVehiclesData?.totalItems ?? 0;
  const isAtLimit = isIndividual && totalIndividualCount >= INDIVIDUAL_MAX_VEHICLES;

  return (
    <AppShell
      title="Add a vehicle"
      subtitle="Complete each section to create your listing and send it for review."
      actions={
        <Link href="/vehicles">
          <Button variant="quiet" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to vehicles
          </Button>
        </Link>
      }
    >
      {isAtLimit && !isLoading ? (
        <div className="p-8 rounded-md border border-(--line) bg-(--surface) max-w-xl mx-auto text-center flex flex-col items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-(--warning)" />
          <h2 className="text-base font-bold font-display text-(--ink)">
            Vehicle listing limit reached
          </h2>
          <p className="text-xs text-(--ink-soft) leading-relaxed">
            Individuals can list up to 2 vehicles. To list more, register as an
            agent.
          </p>
          <div className="pt-2">
            <Link href="/vehicles">
              <Button variant="secondary" size="md">
                Back to your vehicles
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <VehicleForm
          mode="create"
          user={user}
          profile={profile}
        />
      )}
    </AppShell>
  );
}
