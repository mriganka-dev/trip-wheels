"use client";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function AdvertisementCost() {
  const { counts } = useDashboardData();
  const count = counts.openIssues ?? 0;

  return (
    <DashboardCard className="py-6">
      <CardContent className="flex justify-between flex-row px-6">
        <div className="flex flex-col items-start gap-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-normal text-muted-foreground">
                Customer & Owner Disputes
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold">{count}</h3>
                <Badge className={count > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                  {count > 0 ? "Action Required" : "Zero Disputes"}
                </Badge>
              </div>
            </div>
            <div className="border border-border p-2.5 w-fit rounded-md bg-muted/40">
              <AlertCircle size={18} className="text-foreground" />
            </div>
          </div>
          <Link href="/issues" className="w-full">
            <Button
              variant="outline"
              className="flex justify-between items-center w-full px-3 py-2 h-auto rounded-md cursor-pointer text-xs"
            >
              Resolve Disputes
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
