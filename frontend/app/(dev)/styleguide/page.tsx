"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/avatar";

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(2);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <main className="py-12 bg-(--paper) min-h-screen">
      <Container>
        <div className="border-b border-(--line) pb-6 mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--brand)">
            Design System Reference
          </span>
          <h1 className="mt-1 text-3xl font-bold font-display text-(--ink)">
            UI Component Library
          </h1>
          <p className="mt-2 text-sm text-(--ink-soft)">
            Inspection page for testing responsive layouts, states and design tokens across 360 px, 768 px and 1280 px viewports.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {/* Section: Buttons */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Buttons
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary button</Button>
              <Button variant="secondary">Secondary button</Button>
              <Button variant="quiet">Quiet button</Button>
              <Button variant="danger">Danger button</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm">Small size</Button>
              <Button size="md">Medium size</Button>
              <Button size="lg">Large size</Button>
            </div>
          </section>

          {/* Section: Badges */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Status Badges
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="neutral">Waiting for owner</Badge>
              <Badge tone="positive">Confirmed</Badge>
              <Badge tone="warning">Expiring soon</Badge>
              <Badge tone="negative">Not accepted</Badge>
            </div>
          </section>

          {/* Section: Form Fields */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Form Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <Field label="Full name" htmlFor="name" required>
                <Input id="name" placeholder="Rohan Sharma" defaultValue="Rohan Sharma" />
              </Field>

              <Field
                label="Phone number"
                htmlFor="phone"
                error="Enter a valid 10 digit Indian mobile number"
              >
                <Input id="phone" defaultValue="98765" hasError />
              </Field>

              <Field label="Vehicle type" htmlFor="type" hint="Select preferred vehicle category">
                <Select id="type">
                  <option value="bike">Bike or Scooter</option>
                  <option value="car">Car (Manual or Automatic)</option>
                </Select>
              </Field>

              <div className="flex items-center pt-6">
                <Checkbox
                  id="agree"
                  label="I understand documents are verified at pickup"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                />
              </div>

              <div className="md:col-span-2">
                <Field label="Special instructions" htmlFor="notes">
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Provide arrival time or flight details"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Section: Dialog */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Dialog
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open sample modal</Button>
              </DialogTrigger>
              <DialogContent
                title="Rental Guidelines"
                description="Please review document requirements before sending your request."
              >
                <div className="space-y-3 text-sm text-(--ink-soft)">
                  <p>
                    All vehicle rentals require an original Indian driving license and a government ID proof (Aadhaar, Passport or Voter ID) during handover.
                  </p>
                  <p>
                    Payment is completed directly with the owner or rental shop at pickup.
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <DialogTrigger asChild>
                    <Button variant="primary">Understood</Button>
                  </DialogTrigger>
                </div>
              </DialogContent>
            </Dialog>
          </section>

          {/* Section: Tabs */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Tabs
            </h2>
            <Tabs defaultValue="specs">
              <TabsList>
                <TabsTrigger value="specs">Vehicle Details</TabsTrigger>
                <TabsTrigger value="terms">Rental Terms</TabsTrigger>
                <TabsTrigger value="location">Pickup Area</TabsTrigger>
              </TabsList>
              <TabsContent value="specs">
                <p className="text-sm text-(--ink-soft)">
                  Engine capacity: 110 cc, Fuel type: Petrol, Transmission: Automatic.
                </p>
              </TabsContent>
              <TabsContent value="terms">
                <p className="text-sm text-(--ink-soft)">
                  Security deposit: none. Fuel policy: same to same. Free cancellation up to 6 hours before pickup.
                </p>
              </TabsContent>
              <TabsContent value="location">
                <p className="text-sm text-(--ink-soft)">
                  Available near New Digha Sea Beach and Digha Railway Station.
                </p>
              </TabsContent>
            </Tabs>
          </section>

          {/* Section: Toast Triggers */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Toasts
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => showToast("Request sent to vehicle owner", "positive")}
              >
                Show success toast
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => showToast("Unable to reach booking server", "negative")}
              >
                Show error toast
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => showToast("Verification code resent to your email", "neutral")}
              >
                Show neutral toast
              </Button>
            </div>
          </section>

          {/* Section: Avatars */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Initials Avatars
            </h2>
            <div className="flex items-center gap-4">
              <Avatar name="Anil Sharma" size="sm" />
              <Avatar name="Priya Sen" size="md" />
              <Avatar name="Kolkata Wheels" size="lg" />
            </div>
          </section>

          {/* Section: Skeletons */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Skeletons
            </h2>
            <div className="space-y-3 max-w-md">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </section>

          {/* Section: Empty and Error States */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              title="No bookings yet"
              description="You have not requested any vehicles yet. Explore available options at your destination."
              actionLabel="Find a vehicle"
              onAction={() => {}}
            />
            <ErrorState
              title="Unable to load results"
              message="Check your internet connection and try reloading the page."
              onRetry={() => {}}
            />
          </section>

          {/* Section: Pagination */}
          <section className="rounded-md border border-(--line) bg-(--surface) p-6">
            <h2 className="text-lg font-bold font-display mb-4 text-(--ink)">
              Pagination
            </h2>
            <Pagination
              page={currentPage}
              totalPages={5}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </section>
        </div>
      </Container>
    </main>
  );
}

