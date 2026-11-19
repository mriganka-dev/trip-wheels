"use client";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function TotalOrders() {
  const { counts } = useDashboardData();
  const count = counts.pendingVerifications ?? 0;

  return (
    <DashboardCard className="py-6">
      <CardContent className="flex justify-between flex-row px-6">
        <div className="flex flex-col items-start gap-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-normal text-muted-foreground">
                Pending Verifications
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold">{count}</h3>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {count > 0 ? "Requires Call" : "All Clear"}
                </Badge>
              </div>
            </div>
            <div className="border border-border p-2.5 w-fit rounded-md bg-muted/40">
              <UserCheck size={18} className="text-foreground" />
            </div>
          </div>
          <Link href="/verifications" className="w-full">
            <Button
              variant="outline"
              className="flex justify-between items-center w-full px-3 py-2 h-auto rounded-md cursor-pointer text-xs"
            >
              Review Publishers
              <span>
                <ArrowRight width={16} height={16} />
              </span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
