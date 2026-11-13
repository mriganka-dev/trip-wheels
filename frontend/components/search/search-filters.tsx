"use client";

import React, { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import type { Landmark } from "@/types/destination";
import type { SearchVehiclesParams } from "@/types/vehicle";

export interface SearchFiltersProps {
  params: SearchVehiclesParams;
  landmarks?: Landmark[];
  onFilterChange: (newParams: Partial<SearchVehiclesParams>) => void;
  onClearAll: () => void;
}

export function SearchFilters({
  params,
  landmarks = [],
  onFilterChange,
  onClearAll,
}: SearchFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Compute active filters for chips
  const activeChips: Array<{ key: keyof SearchVehiclesParams; label: string }> = [];

  if (params.type && params.type !== "all") {
    activeChips.push({ key: "type", label: `Type: ${params.type}` });
  }
  if (params.maxPrice) {
    activeChips.push({ key: "maxPrice", label: `Max ₹${params.maxPrice}/day` });
  }
  if (params.transmission && params.transmission !== "all") {
    activeChips.push({ key: "transmission", label: `Transmission: ${params.transmission}` });
  }
  if (params.fuelType && params.fuelType !== "all") {
    activeChips.push({ key: "fuelType", label: `Fuel: ${params.fuelType}` });
  }
  if (params.ownerType && params.ownerType !== "all") {
    activeChips.push({
      key: "ownerType",
      label: params.ownerType === "agent" ? "Rental shops" : "Individual owners",
    });
  }
  if (params.nearLandmark) {
    const l = landmarks.find((lm) => lm._id === params.nearLandmark);
    activeChips.push({
      key: "nearLandmark",
      label: `Near: ${l?.name || "Landmark"}`,
    });
  }

  const handleChipRemove = (key: keyof SearchVehiclesParams) => {
    onFilterChange({ [key]: undefined, page: 1 });
  };

  const filterFormContent = (
    <div className="space-y-5 text-sm">
      <Field label="Sort results" htmlFor="filter-sort">
        <Select
          id="filter-sort"
          value={params.sort || "reliability"}
          onChange={(e) =>
            onFilterChange({
              sort: e.target.value as SearchVehiclesParams["sort"],
              page: 1,
            })
          }
        >
          <option value="reliability">Recommended & Reliability</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          {landmarks.length > 0 && <option value="distance">Distance from Landmark</option>}
        </Select>
      </Field>

      <Field label="Max price per day (₹)" htmlFor="filter-max-price">
        <Input
          id="filter-max-price"
          type="number"
          placeholder="e.g. 2000"
          value={params.maxPrice || ""}
          onChange={(e) =>
            onFilterChange({
              maxPrice: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
        />
      </Field>

      <Field label="Transmission" htmlFor="filter-transmission">
        <Select
          id="filter-transmission"
          value={params.transmission || "all"}
          onChange={(e) =>
            onFilterChange({
              transmission: e.target.value === "all" ? undefined : e.target.value,
              page: 1,
            })
          }
        >
          <option value="all">Any transmission</option>
          <option value="manual">Manual</option>
          <option value="automatic">Automatic</option>
        </Select>
      </Field>

      <Field label="Fuel type" htmlFor="filter-fuel">
        <Select
          id="filter-fuel"
          value={params.fuelType || "all"}
          onChange={(e) =>
            onFilterChange({
              fuelType: e.target.value === "all" ? undefined : e.target.value,
              page: 1,
            })
          }
        >
          <option value="all">Any fuel</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Electric</option>
          <option value="cng">CNG</option>
        </Select>
      </Field>

      <Field label="Listed by" htmlFor="filter-owner">
        <Select
          id="filter-owner"
          value={params.ownerType || "all"}
          onChange={(e) =>
            onFilterChange({
              ownerType: e.target.value === "all" ? undefined : e.target.value,
              page: 1,
            })
          }
        >
          <option value="all">All publishers</option>
          <option value="agent">Rental shops (agents)</option>
          <option value="individual">Individual owners</option>
        </Select>
      </Field>

      {landmarks.length > 0 && (
        <>
          <Field label="Near landmark" htmlFor="filter-landmark">
            <Select
              id="filter-landmark"
              value={params.nearLandmark || ""}
              onChange={(e) =>
                onFilterChange({
                  nearLandmark: e.target.value || undefined,
                  page: 1,
                })
              }
            >
              <option value="">Any location in destination</option>
              {landmarks.map((lm) => (
                <option key={lm._id} value={lm._id}>
                  {lm.name}
                </option>
              ))}
            </Select>
          </Field>

          {params.nearLandmark && (
            <Field label="Max distance (km)" htmlFor="filter-dist">
              <Select
                id="filter-dist"
                value={params.maxDistanceKm || 25}
                onChange={(e) =>
                  onFilterChange({
                    maxDistanceKm: Number(e.target.value),
                    page: 1,
                  })
                }
              >
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
              </Select>
            </Field>
          )}
        </>
      )}

      {activeChips.length > 0 && (
        <div className="pt-2">
          <Button
            variant="quiet"
            size="sm"
            onClick={onClearAll}
            className="w-full text-xs text-(--negative)"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {activeChips.length > 0 ? `(${activeChips.length})` : ""}</span>
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Filter results"
            description="Refine vehicles by transmission, fuel, price and location."
            className="max-h-[90vh] overflow-y-auto"
          >
            <div className="mt-4">
              {filterFormContent}
              <div className="mt-6 flex justify-end">
                <Button variant="primary" onClick={() => setMobileOpen(false)}>
                  Show results
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-(--ink-soft) font-medium">Active:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-(--brand-tint) text-(--brand-dark) border border-(--line)"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => handleChipRemove(chip.key)}
                className="hover:text-(--negative) focus-visible:outline-hidden"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-(--ink-soft) hover:text-(--negative) underline underline-offset-2 ml-1"
          >
            Reset
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block rounded-md border border-(--line) bg-(--surface) p-5 sticky top-24">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-(--line)">
          <h2 className="font-display font-bold text-sm text-(--ink) flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-(--brand)" />
            Filters & Sorting
          </h2>
          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-(--ink-soft) hover:text-(--negative)"
            >
              Reset
            </button>
          )}
        </div>
        {filterFormContent}
      </div>
    </div>
  );
}

