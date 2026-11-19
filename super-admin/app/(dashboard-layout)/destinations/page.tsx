"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Edit2,
  Landmark as LandmarkIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LocationPicker } from "@/components/maps/location-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  createDestination,
  getAdminDestinations,
  updateDestination,
} from "@/lib/api/destinations";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateDestinationPayload,
  DestinationItem,
  DestinationLandmark,
  UpdateDestinationPayload,
} from "@/types/destinations";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DestinationsPage() {
  usePageTitle("Destinations");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState<number>(1);

  // Form / Dialog states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingDestination, setEditingDestination] = useState<DestinationItem | null>(null);

  // Deactivate confirm dialog
  const [deactivateTarget, setDeactivateTarget] = useState<DestinationItem | null>(null);

  // Form fields
  const [formName, setFormName] = useState<string>("");
  const [formSlug, setFormSlug] = useState<string>("");
  const [formState, setFormState] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formCoords, setFormCoords] = useState<[number, number]>([87.5113, 21.6266]); // [lng, lat]
  const [formLandmarks, setFormLandmarks] = useState<DestinationLandmark[]>([]);
  const [formNearby, setFormNearby] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // New landmark form state
  const [newLandmarkName, setNewLandmarkName] = useState<string>("");
  const [newLandmarkType, setNewLandmarkType] = useState<"railway_station" | "airport" | "bus_stand" | "other">("other");
  const [newLandmarkLat, setNewLandmarkLat] = useState<string>("");
  const [newLandmarkLng, setNewLandmarkLng] = useState<string>("");

  // Query destinations
  const destinationsQuery = useQuery({
    queryKey: queryKeys.destinations.list({ page }),
    queryFn: () => getAdminDestinations({ page, limit: 15 }),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const destinationsList = destinationsQuery.data?.items || [];

  const handleOpenAdd = () => {
    setEditingDestination(null);
    setFormName("");
    setFormSlug("");
    setFormState("");
    setFormIsActive(true);
    setFormCoords([87.5113, 21.6266]);
    setFormLandmarks([]);
    setFormNearby([]);
    setApiError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dest: DestinationItem) => {
    setEditingDestination(dest);
    setFormName(dest.name);
    setFormSlug(dest.slug);
    setFormState(dest.state);
    setFormIsActive(dest.isActive);
    setFormCoords(dest.location?.coordinates || [87.5113, 21.6266]);
    setFormLandmarks(dest.landmarks || []);

    const nearbyIds = (dest.nearbyDestinations || []).map((n) =>
      typeof n === "object" ? n._id : n
    );
    setFormNearby(nearbyIds);
    setApiError(null);
    setIsFormOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingDestination) {
      setFormSlug(generateSlug(val));
    }
  };

  // Add landmark to list
  const handleAddLandmark = () => {
    const lat = parseFloat(newLandmarkLat);
    const lng = parseFloat(newLandmarkLng);
    if (!newLandmarkName.trim() || isNaN(lat) || isNaN(lng)) {
      showToast("Please enter landmark name, latitude, and longitude", "negative");
      return;
    }

    setFormLandmarks((prev) => [
      ...prev,
      {
        name: newLandmarkName.trim(),
        type: newLandmarkType,
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    ]);

    setNewLandmarkName("");
    setNewLandmarkLat("");
    setNewLandmarkLng("");
    setNewLandmarkType("other");
  };

  const handleRemoveLandmark = (idx: number) => {
    setFormLandmarks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateDestinationPayload) => createDestination(payload),
    onSuccess: () => {
      showToast("Destination created successfully", "brand");
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations.all });
    },
    onError: (err: Error) => {
      setApiError(err.message || "Failed to create destination");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDestinationPayload }) =>
      updateDestination(id, payload),
    onSuccess: () => {
      showToast("Destination updated successfully", "brand");
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations.all });
    },
    onError: (err: Error) => {
      setApiError(err.message || "Failed to update destination");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateDestination(id, { isActive }),
    onSuccess: (_, vars) => {
      showToast(
        vars.isActive ? "Destination activated" : "Destination deactivated",
        vars.isActive ? "brand" : "warning"
      );
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations.all });
    },
    onError: (err: Error) => showToast(err.message || "Action failed", "negative"),
  });

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!formName.trim() || !formSlug.trim() || !formState.trim()) {
      setApiError("Please fill in destination name, slug, and state.");
      return;
    }

    if (editingDestination) {
      updateMutation.mutate({
        id: editingDestination._id,
        payload: {
          name: formName.trim(),
          state: formState.trim(),
          isActive: formIsActive,
          location: {
            type: "Point",
            coordinates: formCoords,
          },
          landmarks: formLandmarks,
          nearbyDestinations: formNearby,
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        slug: formSlug.trim(),
        state: formState.trim(),
        country: "India",
        isActive: formIsActive,
        location: {
          type: "Point",
          coordinates: formCoords,
        },
        landmarks: formLandmarks,
        nearbyDestinations: formNearby,
      });
    }
  };

  const columns: Column<DestinationItem>[] = [
    {
      key: "name",
      header: "Destination",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-ink text-sm flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand" />
            {item.name}
          </span>
          <span className="text-xs text-ink-soft font-mono">
            /destinations/{item.slug}
          </span>
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      render: (item) => <span className="text-sm text-ink">{item.state}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge tone={item.isActive ? "brand" : "neutral"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "landmarks",
      header: "Landmarks",
      render: (item) => (
        <span className="text-xs text-ink-soft">
          {item.landmarks?.length || 0} landmarks
        </span>
      ),
    },
    {
      key: "nearby",
      header: "Nearby Destinations",
      render: (item) => {
        const nearby = item.nearbyDestinations || [];
        if (nearby.length === 0) return <span className="text-xs text-ink-soft">None</span>;
        return (
          <span className="text-xs text-ink-soft">
            {nearby.length} connected
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="quiet"
            size="sm"
            onClick={() => handleOpenEdit(item)}
            className="text-xs h-7"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>

          {item.isActive ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setDeactivateTarget(item)}
              className="text-xs h-7 text-negative hover:bg-negative/10"
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => toggleActiveMutation.mutate({ id: item._id, isActive: true })}
              className="text-xs h-7 text-brand hover:bg-brand-tint"
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Destinations"
      contextLine="Manage tourist hubs, arrival landmarks, and customer search locations."
    >
      <div className="space-y-4">
        {/* Header action button */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div>
            <h2 className="text-sm font-semibold text-ink">Active Platform Destinations</h2>
            <p className="text-xs text-ink-soft">
              Travelers search vehicles by selecting a verified tourist destination.
            </p>
          </div>

          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add destination
          </Button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={destinationsList}
          keyExtractor={(item) => item._id}
          isLoading={destinationsQuery.isLoading}
          emptyMessage="No destinations found."
        />

        {/* Pagination */}
        {destinationsQuery.data && destinationsQuery.data.totalPages > 1 && (
          <Pagination
            page={destinationsQuery.data.page}
            limit={destinationsQuery.data.limit}
            totalItems={destinationsQuery.data.totalItems}
            totalPages={destinationsQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}

        {/* Dialog: Add / Edit Destination */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent
            title={editingDestination ? `Edit Destination: ${editingDestination.name}` : "Add New Destination"}
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <form onSubmit={handleSubmitForm} className="space-y-5">
              {apiError && (
                <div className="p-3 bg-[#FDF0EF] border border-negative/30 rounded text-xs text-negative">
                  {apiError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Destination Name" required>
                  <Input
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Digha"
                    required
                  />
                </Field>

                <Field
                  label="URL Slug"
                  required
                  hint="Used in web address: /destinations/[slug]"
                >
                  <Input
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. digha"
                    required
                    disabled={Boolean(editingDestination)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="State / Region" required>
                  <Input
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. West Bengal"
                    required
                  />
                </Field>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink">
                    <Checkbox
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                    />
                    <span>Active and visible to customers</span>
                  </label>
                </div>
              </div>

              {/* Warning when deactivating an existing destination */}
              {editingDestination && !formIsActive && editingDestination.isActive && (
                <div className="p-3 bg-[#FEF6E9] border border-warning/30 rounded text-xs text-ink flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>
                    Customers will no longer see this destination. Existing bookings are not changed.
                  </span>
                </div>
              )}

              {/* Location Picker with Map Pin and Lat/Lon */}
              <div className="pt-2 border-t border-line">
                <span className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2 font-display">
                  Destination Center Pin
                </span>
                <LocationPicker
                  value={formCoords}
                  onChange={(coords) => setFormCoords(coords)}
                  label={formName || "Destination Pin"}
                />
              </div>

              {/* Landmarks Manager */}
              <div className="pt-2 border-t border-line space-y-3">
                <span className="block text-xs font-semibold text-ink uppercase tracking-wider font-display">
                  Arrival Landmarks & Pickup Points ({formLandmarks.length})
                </span>

                {formLandmarks.length > 0 && (
                  <div className="divide-y divide-line border border-line rounded bg-paper/50">
                    {formLandmarks.map((lm, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-ink flex items-center gap-1.5">
                            <LandmarkIcon className="w-3.5 h-3.5 text-brand" />
                            {lm.name}
                          </span>
                          <span className="text-ink-soft capitalize">
                            Type: {lm.type.replace(/_/g, " ")} &bull; Coordinates: [
                            {lm.location.coordinates[1].toFixed(4)}, {lm.location.coordinates[0].toFixed(4)}]
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="quiet"
                          size="sm"
                          onClick={() => handleRemoveLandmark(idx)}
                          className="text-negative hover:bg-negative/10 h-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add landmark mini form */}
                <div className="bg-paper p-3 rounded border border-line space-y-3">
                  <span className="text-xs font-medium text-ink block">Add a Landmark</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Landmark name (e.g. Old Digha Railway Station)"
                      value={newLandmarkName}
                      onChange={(e) => setNewLandmarkName(e.target.value)}
                      className="text-xs"
                    />
                    <Select
                      value={newLandmarkType}
                      onChange={(e) =>
                        setNewLandmarkType(
                          e.target.value as "railway_station" | "airport" | "bus_stand" | "other"
                        )
                      }
                      options={[
                        { label: "Other", value: "other" },
                        { label: "Railway Station", value: "railway_station" },
                        { label: "Airport", value: "airport" },
                        { label: "Bus Stand", value: "bus_stand" },
                      ]}
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude (e.g. 21.6280)"
                      value={newLandmarkLat}
                      onChange={(e) => setNewLandmarkLat(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude (e.g. 87.5140)"
                      value={newLandmarkLng}
                      onChange={(e) => setNewLandmarkLng(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddLandmark}
                    className="text-xs"
                  >
                    Add Landmark to List
                  </Button>
                </div>
              </div>

              {/* Nearby Destinations Multi-select */}
              <div className="pt-2 border-t border-line space-y-2">
                <span className="block text-xs font-semibold text-ink uppercase tracking-wider font-display">
                  Nearby Connected Destinations
                </span>
                <p className="text-xs text-ink-soft">
                  Select other destinations that travelers often visit together.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-36 overflow-y-auto">
                  {destinationsList
                    .filter((d) => d._id !== editingDestination?._id)
                    .map((d) => {
                      const isSelected = formNearby.includes(d._id);
                      return (
                        <label
                          key={d._id}
                          className={`p-2 rounded border text-xs cursor-pointer select-none transition-colors flex items-center gap-2 ${
                            isSelected
                              ? "bg-brand-tint border-brand/40 text-brand font-medium"
                              : "bg-surface border-line text-ink hover:bg-paper"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormNearby((prev) => [...prev, d._id]);
                              } else {
                                setFormNearby((prev) => prev.filter((id) => id !== d._id));
                              }
                            }}
                          />
                          <span className="truncate">{d.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => setIsFormOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingDestination ? "Save Changes" : "Create Destination"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog: Deactivate Destination */}
        <ConfirmDialog
          open={Boolean(deactivateTarget)}
          onOpenChange={(open) => !open && setDeactivateTarget(null)}
          title="Deactivate Destination"
          description="Customers will no longer see this destination. Existing bookings are not changed."
          targetName={deactivateTarget?.name}
          actionLabel="Deactivate"
          actionVariant="danger"
          isLoading={toggleActiveMutation.isPending}
          onConfirm={() => {
            if (deactivateTarget) {
              toggleActiveMutation.mutate({ id: deactivateTarget._id, isActive: false });
            }
          }}
        />
      </div>
    </AppShell>
  );
}
