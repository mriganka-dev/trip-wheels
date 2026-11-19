"use client";

import { useMemo } from "react";
import { TrendingUp, Calendar, CheckCircle2, Car, Users } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { format } from "date-fns";

const chartConfig = {
  requests: { label: "Booking Requests", color: "var(--color-primary)" },
} satisfies ChartConfig;

export default function TotalSales() {
  const { bookings, analytics, counts, isLive } = useDashboardData();

  // Aggregate real bookings by date
  const chartData = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return [];
    }

    const countsByDate: Record<string, number> = {};
    bookings.forEach((b) => {
      try {
        const d = format(new Date(b.createdAt || b.startAt), "MMM d");
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      } catch {
        // ignore invalid dates
      }
    });

    return Object.entries(countsByDate).map(([date, requests]) => ({
      date,
      requests,
    }));
  }, [bookings]);

  const totalRequests = analytics?.requestsCreated ?? bookings.length;
  const activeFleet = analytics?.activeVehicles ?? 0;
  const acceptanceRate = analytics?.acceptanceRate ?? 0;
  const completionRate = analytics?.completionRate ?? 0;

  return (
    <DashboardCard className="flex flex-col gap-0!">
      {/* Header */}
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={16} className="text-muted-foreground" />
          Rental Demand & Booking Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-6">
        {/* Real Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" />
              Total Requests
            </span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {totalRequests}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {bookings.length} recent in queue
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <Car size={13} className="text-sky-500" />
              Active Fleet
            </span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {activeFleet}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {counts.pendingVehicles || 0} awaiting review
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Acceptance Rate
            </span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {acceptanceRate}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              Publisher response rate
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <Users size={13} className="text-indigo-500" />
              Completion Rate
            </span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {completionRate}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              Trips ended successfully
            </span>
          </div>
        </div>

        {/* Real Chart or Empty State */}
        <div className="w-full">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[180px]! w-full">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    return (
                      <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <span className="text-muted-foreground">{item.payload.date}: </span>
                        <span className="font-semibold">{item.value} bookings</span>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg text-center p-6">
              <Calendar size={28} className="text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">
                No recent booking trend points
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Real-time booking volume will graph automatically as new customer requests and completed trips are recorded in the database.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </DashboardCard>
  );
}
