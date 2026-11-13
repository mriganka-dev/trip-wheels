"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getActiveDestinations } from "@/lib/api/destinations";
import { queryKeys } from "@/lib/query-keys";
import { getDefaultBookingDates } from "@/lib/format";
import { validateSearchInputs } from "@/lib/search-validation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { Destination } from "@/types/destination";

export interface SearchFormProps {
  initialDestination?: string;
  initialFrom?: string;
  initialTo?: string;
  initialType?: string;
  destinations?: Destination[];
  compact?: boolean;
}

export function SearchForm({
  initialDestination = "",
  initialFrom,
  initialTo,
  initialType = "all",
  destinations: preloadedDestinations,
  compact = false,
}: SearchFormProps) {
  const router = useRouter();
  const defaults = getDefaultBookingDates();

  const [destination, setDestination] = useState(initialDestination);
  const [from, setFrom] = useState(initialFrom || defaults.from);
  const [to, setTo] = useState(initialTo || defaults.to);
  const [type, setType] = useState(initialType);
  const [error, setError] = useState<string | null>(null);

  const { data: fetchedDestinations } = useQuery<Destination[]>({
    queryKey: queryKeys.destinations.all,
    queryFn: getActiveDestinations,
    enabled: !preloadedDestinations || preloadedDestinations.length === 0,
    staleTime: 60 * 60 * 1000,
  });

  const availableDestinations = preloadedDestinations || fetchedDestinations || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateSearchInputs({ destination, from, to });
    if (!validation.isValid && validation.error) {
      setError(validation.error);
      return;
    }

    const query = new URLSearchParams({
      destination,
      from,
      to,
    });

    if (type && type !== "all") {
      query.set("type", type);
    }

    router.push(`/search?${query.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-md border border-(--line) bg-(--surface) p-4 sm:p-6 ${
        compact ? "" : "shadow-xs"
      }`}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-(--negative)"
        >
          {error}
        </div>
      )}

      <div
        className={`grid gap-4 ${
          compact
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <Field label="Destination" htmlFor="search-destination" required>
          <Select
            id="search-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Select destination</option>
            {availableDestinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}, {d.state}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Pickup date & time" htmlFor="search-from" required>
          <Input
            id="search-from"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>

        <Field label="Return date & time" htmlFor="search-to" required>
          <Input
            id="search-to"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>

        <Field label="Vehicle type" htmlFor="search-type">
          <Select
            id="search-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">Any vehicle</option>
            <option value="bike">Bike or Scooter</option>
            <option value="car">Car</option>
          </Select>
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          Find vehicles
        </Button>
      </div>
    </form>
  );
}

