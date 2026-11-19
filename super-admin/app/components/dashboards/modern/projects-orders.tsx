"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Car,
  Calendar,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Phone,
  Clock,
  ListTodo,
} from "lucide-react";
import { CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SimpleBar from "simplebar-react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatWaitingFor } from "@/lib/format";

type TabKey = "verifications" | "vehicles" | "tasks" | "bookings" | "issues";

export default function ProjectsOrders() {
  const [activeTab, setActiveTab] = useState<TabKey>("verifications");
  const { verifications, vehicles, tasks, bookings, issues, counts } = useDashboardData();

  return (
    <DashboardCard className="flex flex-col gap-0!">
      {/* Header with Navigation Tabs */}
      <CardHeader className="border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>Operational Decision Queues</span>
          </CardTitle>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={activeTab === "verifications" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("verifications")}
            className="h-8 text-xs cursor-pointer gap-1.5"
          >
            <ShieldCheck size={14} />
            Verifications
            <span className="ml-1 rounded-full px-1.5 py-0.2 bg-background/20 text-xs">
              {counts.pendingVerifications ?? 0}
            </span>
          </Button>

          <Button
            variant={activeTab === "vehicles" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("vehicles")}
            className="h-8 text-xs cursor-pointer gap-1.5"
          >
            <Car size={14} />
            Vehicles
            <span className="ml-1 rounded-full px-1.5 py-0.2 bg-background/20 text-xs">
              {counts.pendingVehicles ?? 0}
            </span>
          </Button>

          <Button
            variant={activeTab === "tasks" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("tasks")}
            className="h-8 text-xs cursor-pointer gap-1.5"
          >
            <ListTodo size={14} />
            Call Tasks
            <span className="ml-1 rounded-full px-1.5 py-0.2 bg-background/20 text-xs">
              {counts.openTasks ?? 0}
            </span>
          </Button>

          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("bookings")}
            className="h-8 text-xs cursor-pointer gap-1.5"
          >
            <Calendar size={14} />
            Recent Bookings
            <span className="ml-1 rounded-full px-1.5 py-0.2 bg-background/20 text-xs">
              {bookings.length}
            </span>
          </Button>

          <Button
            variant={activeTab === "issues" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("issues")}
            className="h-8 text-xs cursor-pointer gap-1.5"
          >
            <AlertCircle size={14} />
            Disputes
            <span className="ml-1 rounded-full px-1.5 py-0.2 bg-background/20 text-xs">
              {counts.openIssues ?? 0}
            </span>
          </Button>
        </div>
      </CardHeader>

      {/* Table Content */}
      <CardContent className="px-0!">
        <SimpleBar>
          <div className="overflow-x-auto min-w-[750px]">
            {/* TAB 1: PENDING VERIFICATIONS */}
            {activeTab === "verifications" && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6! text-xs font-medium text-muted-foreground">Publisher / Owner</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Type & Location</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Submitted</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="pr-6! text-right text-xs font-medium text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        No pending verifications waiting.
                      </TableCell>
                    </TableRow>
                  ) : (
                    verifications.map((item) => {
                      const waited = formatWaitingFor(item.submittedAt || item.createdAt);
                      const isAgent = item.publisherType === "agent";
                      const location =
                        item.individualArea?.city ||
                        (typeof item.destination === "object" ? item.destination?.name : item.destination);

                      return (
                        <TableRow key={item._id} className="border-border hover:bg-muted/30">
                          <TableCell className="pl-6! py-3.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground">
                                {item.user?.fullName || item.businessName || "Unnamed Publisher"}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone size={12} /> {item.user?.phone || "No phone"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2">
                              <Badge className={isAgent ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-foreground"}>
                                {isAgent ? "Agency" : "Individual"}
                              </Badge>
                              {location && <span className="text-xs text-muted-foreground">{location}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} /> Waited {waited}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                              Awaiting Verification Call
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6! text-right py-3.5">
                            <Link href={`/verifications/${item._id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                                Review <ArrowRight size={12} />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 2: VEHICLES AWAITING REVIEW */}
            {activeTab === "vehicles" && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6! text-xs font-medium text-muted-foreground">Vehicle Model</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Category & Plate</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Publisher</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Daily Rate</TableHead>
                    <TableHead className="pr-6! text-right text-xs font-medium text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        No vehicles waiting for review.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((v) => {
                      const pubName =
                        typeof v.publisher === "object"
                          ? v.publisher?.fullName
                          : "Publisher";

                      return (
                        <TableRow key={v._id} className="border-border hover:bg-muted/30">
                          <TableCell className="pl-6! py-3.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground">
                                {v.brand} {v.model}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Submitted {formatWaitingFor(v.createdAt)} ago
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 capitalize">
                                {v.type}
                              </Badge>
                              {v.registrationNumber && (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {v.registrationNumber}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 text-xs text-muted-foreground">
                            {pubName}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="font-semibold text-sm text-foreground">
                              ₹{(v.pricing?.perDay || 0).toLocaleString("en-IN")}/day
                            </span>
                          </TableCell>
                          <TableCell className="pr-6! text-right py-3.5">
                            <Link href={`/vehicles/${v._id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                                Moderate <ExternalLink size={12} />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 3: CALL TASKS */}
            {activeTab === "tasks" && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6! text-xs font-medium text-muted-foreground">Task / Purpose</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Contact</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Timeline</TableHead>
                    <TableHead className="pr-6! text-right text-xs font-medium text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        All call tasks completed. No urgent follow-ups pending.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const typeLabel =
                        task.type === "call_publisher_no_response"
                          ? "Call Publisher: No Response"
                          : task.type === "call_publisher_unconfirmed_vehicle"
                          ? "Call: Vehicle Unconfirmed"
                          : task.type === "call_publisher_pickup_unconfirmed"
                          ? "Call: Pickup Not Confirmed"
                          : task.type.replace(/_/g, " ");

                      const phone =
                        task.publisher?.phone ||
                        "No phone recorded";

                      return (
                        <TableRow key={task._id} className="border-border hover:bg-muted/30">
                          <TableCell className="pl-6! py-3.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground capitalize">
                                {task.note || task.publisher?.fullName || typeLabel}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock size={12} /> Created {formatWaitingFor(task.createdAt)} ago
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs capitalize">
                              {task.type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                              <Phone size={12} /> {phone}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-xs text-muted-foreground">
                              {task.dueAt ? `Due in ${formatWaitingFor(task.dueAt)}` : "Immediate attention"}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6! text-right py-3.5">
                            <Link href="/tasks">
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                                Open Tasks <ArrowRight size={12} />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 4: RECENT BOOKINGS */}
            {activeTab === "bookings" && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6! text-xs font-medium text-muted-foreground">Booking ID</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Vehicle</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Amount</TableHead>
                    <TableHead className="pr-6! text-right text-xs font-medium text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        No recent bookings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b) => {
                      const customerName =
                        typeof b.customer === "object" && b.customer?.fullName
                          ? b.customer.fullName
                          : "Customer";
                      const customerPhone =
                        typeof b.customer === "object" && b.customer?.phone
                          ? b.customer.phone
                          : "";
                      const vehicleName =
                        typeof b.vehicle === "object" && b.vehicle
                          ? `${b.vehicle.brand} ${b.vehicle.model}`
                          : typeof b.assignedVehicle === "object" && b.assignedVehicle
                          ? `${b.assignedVehicle.brand} ${b.assignedVehicle.model}`
                          : "Vehicle Assignment Pending";
                      const totalAmount = b.pricingSnapshot?.estimatedTotal ?? 0;

                      return (
                        <TableRow key={b._id} className="border-border hover:bg-muted/30">
                          <TableCell className="pl-6! py-3.5 font-mono text-xs font-medium text-foreground">
                            <Link href={`/bookings/${b._id}`} className="hover:underline text-primary">
                              {b.bookingCode || b._id}
                            </Link>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {customerName}
                              </span>
                              {customerPhone && (
                                <span className="text-xs text-muted-foreground">
                                  {customerPhone}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-sm text-foreground">
                              {vehicleName}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="font-semibold text-sm text-foreground">
                              ₹{totalAmount.toLocaleString("en-IN")}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6! text-right py-3.5">
                            <Badge
                              className={
                                b.status === "confirmed"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize"
                                  : b.status === "ongoing"
                                  ? "bg-sky-500/10 text-sky-600 border-sky-500/20 capitalize"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20 capitalize"
                              }
                            >
                              {b.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 5: DISPUTES & ISSUES */}
            {activeTab === "issues" && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6! text-xs font-medium text-muted-foreground">Dispute / Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Description</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Raised By</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Severity</TableHead>
                    <TableHead className="pr-6! text-right text-xs font-medium text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        Zero open disputes. All customers and publishers satisfied.
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((issue) => (
                      <TableRow key={issue._id} className="border-border hover:bg-muted/30">
                        <TableCell className="pl-6! py-3.5 font-mono text-xs font-semibold text-foreground capitalize">
                          {issue.type?.replace("_", " ") || "General Dispute"}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <span className="text-sm font-medium text-foreground">
                            {issue.description}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 text-xs text-muted-foreground">
                          {issue.raisedBy?.fullName || "Customer"}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Badge
                            className={
                              issue.severity === "high" || issue.severity === "critical"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20 capitalize"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20 capitalize"
                            }
                          >
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6! text-right py-3.5">
                          <Link href={`/issues/${issue._id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                              Resolve <ArrowRight size={12} />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </SimpleBar>
      </CardContent>
    </DashboardCard>
  );
}
