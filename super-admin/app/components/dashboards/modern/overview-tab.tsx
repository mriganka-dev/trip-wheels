"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Download, Sun, Moon } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { downloadResourceCsv } from "@/lib/api/users";

export default function OverviewTab() {
  const [greeting, setGreeting] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { isLive, refreshAll, counts } = useDashboardData();

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night");
    }
  }, []);

  const getGreetingIcon = () => {
    if (greeting === "Good Morning" || greeting === "Good Afternoon") {
      return <Sun size={22} className="text-amber-500" />;
    } else {
      return <Moon size={22} className="text-indigo-400" />;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await downloadResourceCsv("bookings");
      const timestamp = new Date().getTime();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bookings-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // fallback to direct download URL
      window.open("/api/v1/admin/export/bookings", "_blank");
    } finally {
      setIsExporting(false);
    }
  };

  const urgentDecisions = (counts.pendingVerifications || 0) + (counts.pendingVehicles || 0);

  return (
    <div className="flex items-center flex-wrap lg:flex-nowrap lg:gap-0 gap-4 justify-between">
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {greeting}, Operations Team <span>{getGreetingIcon()}</span>
          </h2>
          {isLive ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs flex items-center gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Backend API
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs flex items-center gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Operational Standby Mode
            </Badge>
          )}
        </div>
        <p className="text-sm font-normal text-muted-foreground">
          Trip Wheels Marketplace Console &bull;{" "}
          <span className="font-medium text-foreground">
            {urgentDecisions} urgent decision{urgentDecisions === 1 ? "" : "s"} waiting
          </span>
        </p>
      </div>

      <div className="flex items-center lg:flex-nowrap flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleRefresh}
          title="Refresh actual data from backend"
          className="p-2.5 h-auto outline rounded-lg cursor-pointer transition-transform"
        >
          <RefreshCcw size={16} className={isRefreshing ? "animate-spin text-primary" : ""} />
        </Button>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 h-auto px-4 py-2 rounded-lg cursor-pointer"
        >
          <Download size={16} />
          <span className="text-sm font-medium">{isExporting ? "Exporting..." : "Export Bookings CSV"}</span>
        </Button>
      </div>
    </div>
  );
}
