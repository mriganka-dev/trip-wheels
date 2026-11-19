"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { Users, Car, Calendar, PhoneCall, Compass } from "lucide-react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/use-dashboard-data";

type AssetCardProps = {
  title: string;
  href: string;
  value: string | number;
  icon: React.ElementType;
};

function AssetCard({ title, href, value, icon: Icon }: AssetCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between p-6 bg-background hover:bg-muted/30 transition-colors group"
    >
      <div className="border border-border rounded-md p-2 w-fit bg-muted/40 group-hover:border-primary/50 transition-colors">
        <Icon width={16} height={16} className="text-foreground" />
      </div>
      <div className="mt-4">
        <h6 className="text-2xl font-semibold tracking-tight">{value}</h6>
        <p className="text-sm font-normal text-muted-foreground">{title}</p>
      </div>
    </Link>
  );
}

export default function TotalAssets() {
  const { counts } = useDashboardData();

  const assetsData = [
    {
      id: "verifications",
      title: "Pending Verifications",
      href: "/verifications",
      value: counts.pendingVerifications ?? 0,
      icon: Users,
    },
    {
      id: "vehicles",
      title: "Pending Vehicle Reviews",
      href: "/vehicles",
      value: counts.pendingVehicles ?? 0,
      icon: Car,
    },
    {
      id: "tasks",
      title: "Open Call Tasks",
      href: "/tasks",
      value: counts.openTasks ?? 0,
      icon: PhoneCall,
    },
    {
      id: "requests",
      title: "Awaiting Response",
      href: "/bookings",
      value: counts.requestsAwaitingResponse ?? 0,
      icon: Calendar,
    },
  ];

  return (
    <DashboardCard className="flex flex-col gap-0! pb-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Compass size={16} className="text-muted-foreground" />
          Marketplace Operations Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full! px-0!">
        <div className="h-full!">
          <div className="grid grid-cols-2 h-full! gap-px bg-border">
            {assetsData.map((item) => (
              <AssetCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
