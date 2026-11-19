"use client";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function UpdateBanner() {
  const { counts } = useDashboardData();

  const atRiskCount =
    (counts.requestsAwaitingResponse || 0) +
    (counts.unconfirmedVehicles24h || 0) +
    (counts.upcomingPickups24h || 0);

  const hasUrgentItems = atRiskCount > 0 || (counts.pendingVerifications || 0) > 0;

  return (
    <DashboardCard className="py-3">
      <CardContent className="flex items-center flex-wrap justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                hasUrgentItems ? "bg-amber-500 animate-ping" : "bg-emerald-500"
              } absolute inline-flex`}
            />
            <span
              className={`h-2 w-2 rounded-full ${
                hasUrgentItems ? "bg-amber-500" : "bg-emerald-500"
              } absolute inline-flex`}
            />
            <p className="text-sm font-medium ps-4">
              {hasUrgentItems ? "Operational Notice" : "System Healthy"}
            </p>
            <span className="w-1 h-1 rounded-full bg-border" />
            <p className="text-sm font-normal text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <p className="text-sm font-normal">
            {hasUrgentItems ? (
              <span>
                <strong className="text-amber-600 font-semibold">
                  {counts.requestsAwaitingResponse || 0}
                </strong>{" "}
                booking requests awaiting response &bull;{" "}
                <strong className="text-foreground font-semibold">
                  {counts.upcomingPickups24h || 0}
                </strong>{" "}
                pickups scheduled within next 24 hours &bull;{" "}
                <strong className="text-foreground font-semibold">
                  {counts.pendingVerifications || 0}
                </strong>{" "}
                publishers waiting for document verification.
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> All publisher verifications, vehicle listings, and bookings are up to date.
              </span>
            )}
          </p>
        </div>

        <Link href="/bookings">
          <Button
            variant="outline"
            className="flex gap-1.5 px-4 py-2 h-auto rounded-md cursor-pointer text-xs sm:text-sm"
          >
            Review Operations
            <span>
              <ArrowRight width={16} height={16} />
            </span>
          </Button>
        </Link>
      </CardContent>
    </DashboardCard>
  );
}
