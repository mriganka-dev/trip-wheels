"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { DefinitionList } from "@/components/ui/definition-list";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { CopyButton } from "@/components/ui/copy-button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

export function StyleguideClient() {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioVal, setRadioVal] = useState("daily");

  const sampleTableData = [
    { id: "1", name: "Ravi Travels", vehicle: "Royal Enfield Classic 350", status: "pending" },
    { id: "2", name: "Guwahati Bikes", vehicle: "Yamaha FZ-S", status: "approved" },
    { id: "3", name: "Pooja Motor Hub", vehicle: "Hyundai Creta", status: "rejected" },
  ];

  return (
    <div className="min-h-screen bg-paper p-6 sm:p-10 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-ink">Super Admin Design System Styleguide</h1>
        <p className="text-sm text-ink-soft mt-1">
          Development reference for components, design tokens, and accessibility primitives.
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="quiet">Quiet Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="primary" isLoading>Loading State</Button>
          <Button variant="secondary" disabled>Disabled State</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Status Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="brand">Approved (Brand)</Badge>
          <Badge tone="warning">Waiting for review (Warning)</Badge>
          <Badge tone="negative">Rejected (Negative)</Badge>
          <Badge tone="neutral">Draft (Neutral)</Badge>
        </div>
      </section>

      {/* Form Controls */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Form Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Agent business name" required hint="Legal entity name on registration">
            <Input placeholder="e.g. Northeast Wheels Rental" />
          </Field>
          <Field label="Registration document number" error="Invalid document number format">
            <Input hasError defaultValue="DL01ABC" />
          </Field>
          <Field label="Operational status">
            <Select
              options={[
                { label: "Active operations", value: "active" },
                { label: "Temporarily paused", value: "paused" },
              ]}
            />
          </Field>
          <Field label="Administrative review remarks">
            <Textarea placeholder="Enter audit verification notes..." />
          </Field>
        </div>

        <div className="pt-2 space-y-3">
          <Checkbox
            label="Confirm phone number verified via call"
            hint="Agent confirmed OTP or voice call details"
            checked={checkboxChecked}
            onChange={(e) => setCheckboxChecked(e.target.checked)}
          />

          <RadioGroup
            name="payout-cadence"
            value={radioVal}
            onChange={(e) => setRadioVal(e.target.value)}
            options={[
              { label: "Daily settlement", value: "daily", hint: "Direct cash or UPI at pickup" },
              { label: "Weekly settlement", value: "weekly", hint: "Direct batch settlement" },
            ]}
          />
        </div>
      </section>

      {/* Modals and Dialogs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Dialogs and Confirmations</h2>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open Base Dialog</Button>
            </DialogTrigger>
            <DialogContent title="Verification Guidelines">
              <p className="text-sm text-ink-soft">
                All identity documents must be checked against state databases before approving individual owners.
              </p>
            </DialogContent>
          </Dialog>

          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Destructive Confirm Dialog
          </Button>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Reject publisher verification"
            description="Rejecting will prevent this publisher from listing vehicles. A detailed reason is required."
            targetName="Ravi Travels (Agent)"
            actionLabel="Reject Verification"
            actionVariant="danger"
            requireNote
            noteLabel="Mandatory rejection reason"
            onConfirm={(note) => {
              showToast(`Rejected with note: ${note}`, "negative");
              setConfirmOpen(false);
            }}
          />
        </div>
      </section>

      {/* Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Toasts</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => showToast("Vehicle approved successfully", "brand")}>
            Brand Toast
          </Button>
          <Button variant="secondary" onClick={() => showToast("Verification call is overdue", "warning")}>
            Warning Toast
          </Button>
          <Button variant="secondary" onClick={() => showToast("Failed to update status", "negative")}>
            Negative Toast
          </Button>
          <Button variant="secondary" onClick={() => showToast("Action logged in audit trail", "neutral")}>
            Neutral Toast
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Tabs</h2>
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Publisher Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">Audit History</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <DefinitionList
              items={[
                { label: "Owner Name", value: "Ravi Sharma" },
                { label: "Publisher Type", value: "Agent (Shop)" },
                { label: "City", value: "Guwahati, Assam" },
              ]}
            />
          </TabsContent>
          <TabsContent value="documents">
            <p className="text-sm text-ink-soft">Aadhar Card and Trade License on file.</p>
          </TabsContent>
          <TabsContent value="history">
            <p className="text-sm text-ink-soft">Audit history records will appear here.</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* Data Table and Filters */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Table and FilterBar</h2>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search owners or vehicles..."
        >
          <Select
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Pending only", value: "pending" },
            ]}
          />
        </FilterBar>

        <DataTable
          columns={[
            { header: "Publisher", key: "name", isPrimary: true },
            { header: "Vehicle", key: "vehicle" },
            {
              header: "Status",
              key: "status",
              render: (row) => (
                <Badge
                  tone={
                    row.status === "approved"
                      ? "brand"
                      : row.status === "rejected"
                      ? "negative"
                      : "warning"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
          ]}
          data={sampleTableData}
          keyExtractor={(item) => item.id}
        />

        <Pagination
          page={page}
          limit={10}
          totalItems={35}
          totalPages={4}
          onPageChange={setPage}
        />
      </section>

      {/* Definition List and Avatars */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Avatars and Copy Button</h2>
        <div className="flex items-center gap-6">
          <InitialsAvatar name="Ravi Sharma" size="lg" />
          <InitialsAvatar name="Pooja Baruah" size="md" />
          <InitialsAvatar name="N" size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">+91 98765 43210</span>
            <CopyButton value="+919876543210" label="Copy phone" />
          </div>
        </div>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Skeletons</h2>
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </section>

      {/* States */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Empty and Error States</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EmptyState
            title="No pending verifications"
            description="All publisher submissions have been verified and processed."
          />
          <ErrorState
            title="Failed to load verifications"
            message="The network request failed while fetching queue data."
            onRetry={() => showToast("Retrying request...", "neutral")}
          />
        </div>
      </section>

      {/* Sticky Action Bar */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink border-b border-line pb-2">Sticky Action Bar</h2>
        <StickyActionBar info="1 owner decision pending">
          <Button variant="quiet">Request Changes</Button>
          <Button variant="danger">Reject</Button>
          <Button variant="primary">Approve Verification</Button>
        </StickyActionBar>
      </section>
    </div>
  );
}
