"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Countdown } from "@/components/ui/countdown";
import { DataTable } from "@/components/ui/data-table";
import { DefinitionList } from "@/components/ui/definition-list";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { FileInput } from "@/components/ui/file-input";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { showToast } = useToast();
  const [selectedRadio, setSelectedRadio] = useState("agent");
  const [isChecked, setIsChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sampleDeadline] = useState(
    () => new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000)
  );

  const sampleTableData = [
    { id: "1", vehicle: "Royal Enfield Classic 350", number: "GA 03 AB 1234", status: "active", rent: "₹1,200" },
    { id: "2", vehicle: "Honda Activa 6G", number: "GA 03 CD 5678", status: "pending_review", rent: "₹500" },
    { id: "3", vehicle: "Maruti Suzuki Swift", number: "GA 03 EF 9012", status: "paused", rent: "₹2,400" },
  ];

  const sampleColumns = [
    { key: "vehicle", header: "Vehicle" },
    { key: "number", header: "Registration" },
    {
      key: "status",
      header: "Status",
      render: (item: (typeof sampleTableData)[0]) => (
        <Badge tone={item.status === "active" ? "brand" : item.status === "pending_review" ? "warning" : "neutral"}>
          {item.status === "active" ? "Live" : item.status === "pending_review" ? "In review" : "Paused"}
        </Badge>
      ),
    },
    { key: "rent", header: "Per Day" },
  ];

  const sampleDefinitionItems = [
    { key: "1", label: "Booking code", value: "TRIP-8492" },
    { key: "2", label: "Pickup window", value: "20 Nov 2026, 9:00 am" },
    { key: "3", label: "Customer name", value: "Aarav Sharma" },
    { key: "4", label: "Total rent", value: "₹2,400 (collect at pickup)" },
  ];

  return (
    <AppShell title="Component Styleguide" subtitle="Development visual test for all UI primitives">
      <div className="flex flex-col gap-10">
        {/* Buttons */}
        <section className="flex flex-col gap-4 p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="quiet">Quiet</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" isLoading>Loading</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="sm">Small button</Button>
            <Button size="md">Medium button</Button>
            <Button size="lg">Large button</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="flex flex-col gap-4 p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">Status Badges</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">Confirmed / Live</Badge>
            <Badge tone="warning">New request / In review</Badge>
            <Badge tone="neutral">Completed / Draft</Badge>
            <Badge tone="negative">Expired / Not approved</Badge>
          </div>
        </section>

        {/* Inputs and Forms */}
        <section className="flex flex-col gap-4 p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">Form Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Vehicle brand" htmlFor="brand-input" required hint="Manufacturer name">
              <Input id="brand-input" placeholder="e.g. Royal Enfield" />
            </Field>

            <Field label="Vehicle model" htmlFor="model-input" error="Model name is required">
              <Input id="model-input" defaultValue="Classic 350" hasError />
            </Field>

            <Field label="Fuel type" htmlFor="fuel-select">
              <Select id="fuel-select" defaultValue="petrol">
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
              </Select>
            </Field>

            <Field label="Vehicle notes" htmlFor="notes-textarea" hint="Visible to partner team">
              <Textarea id="notes-textarea" rows={3} placeholder="Add any special instructions or pickup notes" />
            </Field>
          </div>

          <div className="pt-2">
            <Checkbox
              id="confirm-terms"
              label="I confirm all vehicle papers and insurance are current"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
          </div>

          <div className="pt-2">
            <Field label="Owner type">
              <RadioGroup
                name="owner-type"
                value={selectedRadio}
                onChange={setSelectedRadio}
                options={[
                  { value: "agent", label: "Rental Agent (Shop)", hint: "Fixed counter pickup location with multiple vehicles" },
                  { value: "individual", label: "Individual Owner", hint: "Maximum 2 vehicles with flexible handover area" },
                ]}
              />
            </Field>
          </div>

          <div className="pt-2">
            <Field label="Document upload (RC / Insurance)">
              <FileInput maxSizeMb={8} />
            </Field>
          </div>
        </section>

        {/* Toasts and Modals */}
        <section className="flex flex-col gap-4 p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">Feedback, Toasts & Dialogs</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => showToast("Booking request accepted", "brand")}>
              Show Brand Toast
            </Button>
            <Button variant="secondary" onClick={() => showToast("Response deadline expires in 15 minutes", "warning")}>
              Show Warning Toast
            </Button>
            <Button variant="secondary" onClick={() => showToast("Request failed to update", "negative")}>
              Show Negative Toast
            </Button>
            <Button variant="secondary" onClick={() => showToast("Draft saved automatically", "neutral")}>
              Show Neutral Toast
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="primary">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent title="Confirm vehicle availability" description="Provide the vehicle details before pickup.">
                <p className="text-sm text-(--ink-soft) mb-4">
                  Once confirmed, vehicle registration details become visible to the customer.
                </p>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button variant="primary">Confirm now</Button>
                </div>
              </DialogContent>
            </Dialog>

            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="secondary">Open Bottom Sheet</Button>
              </BottomSheetTrigger>
              <BottomSheetContent title="Pickup instructions" description="Review details with customer at handover">
                <p className="text-sm text-(--ink) py-2">
                  Check government ID and valid driving license. Take photo of vehicle odometer before handover.
                </p>
              </BottomSheetContent>
            </BottomSheet>
          </div>
        </section>

        {/* Data Table and Definition List */}
        <section className="flex flex-col gap-4 p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">Tables & Definition Lists</h2>
          <DataTable
            columns={sampleColumns}
            data={sampleTableData}
            keyExtractor={(item) => item.id}
          />

          <div className="mt-4 pt-4 border-t border-(--line)">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-(--ink-soft) mb-2">
              Booking Summary Definition List
            </h3>
            <DefinitionList items={sampleDefinitionItems} />
          </div>
        </section>

        {/* Tabs, Countdown, Avatars & Skeletons */}
        <section className="flex flex-col gap-4 p-6 rounded-md border border-(--line) bg-(--surface)">
          <h2 className="text-base font-bold font-display text-(--ink)">Tabs, Countdown & Misc</h2>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-(--ink-soft)">Overview tab content displayed here.</p>
            </TabsContent>
            <TabsContent value="documents">
              <p className="text-sm text-(--ink-soft)">Documents tab content displayed here.</p>
            </TabsContent>
            <TabsContent value="history">
              <p className="text-sm text-(--ink-soft)">History tab content displayed here.</p>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-4 pt-4">
            <span className="text-sm font-medium text-(--ink)">Countdown Timer:</span>
            <Badge tone="warning">
              <Countdown deadline={sampleDeadline} />
            </Badge>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Avatar name="Mriganka Ghosh" size="sm" />
            <Avatar name="Royal Bikes" size="md" />
            <Avatar name="Anand Rental Shop" size="lg" />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          <Pagination
            page={currentPage}
            totalPages={5}
            onPageChange={setCurrentPage}
          />
        </section>

        {/* Empty and Error states */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No vehicles added yet"
            description="Add your first bike or car to start receiving rental requests."
            actionLabel="Add vehicle"
            onAction={() => alert("Add vehicle clicked")}
          />
          <ErrorState
            title="Could not load requests"
            message="Please check your connection and try loading the requests inbox again."
            onRetry={() => alert("Retry clicked")}
          />
        </section>
      </div>
    </AppShell>
  );
}
