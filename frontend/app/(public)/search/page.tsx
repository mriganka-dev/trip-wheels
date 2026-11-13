"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Container } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";
import { SearchFilters } from "@/components/search/search-filters";
import { ResultsList } from "@/components/vehicle/results-list";
import { EmptyResults } from "@/components/search/empty-results";
import { ErrorState } from "@/components/ui/error-state";
import { searchVehicles } from "@/lib/api/vehicles";
import { getActiveDestinations } from "@/lib/api/destinations";
import { queryKeys } from "@/lib/query-keys";
import type { SearchVehiclesParams } from "@/types/vehicle";
import type { Destination } from "@/types/destination";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const destinationParam = searchParams.get("destination") || "";
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";
  const typeParam = searchParams.get("type") || undefined;
  const minPriceParam = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPriceParam = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const transmissionParam = searchParams.get("transmission") || undefined;
  const fuelTypeParam = searchParams.get("fuelType") || undefined;
  const ownerTypeParam = searchParams.get("ownerType") || undefined;
  const nearLandmarkParam = searchParams.get("nearLandmark") || undefined;
  const maxDistanceKmParam = searchParams.get("maxDistanceKm") ? Number(searchParams.get("maxDistanceKm")) : undefined;
  const sortParam = (searchParams.get("sort") as SearchVehiclesParams["sort"]) || undefined;
  const pageParam = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const currentParams: SearchVehiclesParams = {
    destination: destinationParam,
    from: fromParam,
    to: toParam,
    type: typeParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    transmission: transmissionParam,
    fuelType: fuelTypeParam,
    ownerType: ownerTypeParam,
    nearLandmark: nearLandmarkParam,
    maxDistanceKm: maxDistanceKmParam,
    sort: sortParam,
    page: pageParam,
    limit: 10,
  };

  const { data: destinations } = useQuery<Destination[]>({
    queryKey: queryKeys.destinations.all,
    queryFn: getActiveDestinations,
    staleTime: 60 * 60 * 1000,
  });

  const currentDestination = destinations?.find(
    (d) => d.slug.toLowerCase() === destinationParam.toLowerCase()
  );

  const canSearch = Boolean(destinationParam && fromParam && toParam);

  const {
    data: searchData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.vehicles.search(currentParams as unknown as Record<string, unknown>),
    queryFn: () => searchVehicles(currentParams),
    enabled: canSearch,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const updateFilters = (newParams: Partial<SearchVehiclesParams>) => {
    const nextQuery = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(newParams)) {
      if (value === undefined || value === null || value === "") {
        nextQuery.delete(key);
      } else {
        nextQuery.set(key, String(value));
      }
    }

    router.push(`/search?${nextQuery.toString()}`);
  };

  const handleClearAllFilters = () => {
    const nextQuery = new URLSearchParams();
    if (destinationParam) nextQuery.set("destination", destinationParam);
    if (fromParam) nextQuery.set("from", fromParam);
    if (toParam) nextQuery.set("to", toParam);
    if (typeParam) nextQuery.set("type", typeParam);
    router.push(`/search?${nextQuery.toString()}`);
  };

  const destinationDisplayName = currentDestination?.name || destinationParam;

  return (
    <main className="py-8 bg-(--paper) min-h-screen">
      <Container>
        {/* Top search form */}
        <div className="mb-8">
          <SearchForm
            initialDestination={destinationParam}
            initialFrom={fromParam}
            initialTo={toParam}
            initialType={typeParam || "all"}
            destinations={destinations}
            compact
          />
        </div>

        {!canSearch && (
          <div className="rounded-md border border-(--line) bg-(--surface) p-8 text-center text-sm text-(--ink-soft)">
            Select a destination and rental dates above to view available vehicles.
          </div>
        )}

        {canSearch && isError && (
          <ErrorState
            title="Unable to load search results"
            message={
              error instanceof Error
                ? error.message
                : "A network issue prevented loading vehicles. Please try again."
            }
            onRetry={() => refetch()}
          />
        )}

        {canSearch && !isError && searchData && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Filter sidebar */}
            <div className="lg:col-span-1">
              <SearchFilters
                params={currentParams}
                landmarks={currentDestination?.landmarks || []}
                onFilterChange={updateFilters}
                onClearAll={handleClearAllFilters}
              />
            </div>

            {/* Results column */}
            <div className="lg:col-span-3">
              {searchData.items.length === 0 ? (
                <EmptyResults
                  destinationName={destinationDisplayName}
                  suggestions={searchData.suggestions}
                  from={fromParam}
                  to={toParam}
                  onResetFilters={handleClearAllFilters}
                />
              ) : (
                <ResultsList
                  vehicles={searchData.items}
                  totalItems={searchData.totalItems}
                  page={searchData.page}
                  totalPages={searchData.totalPages}
                  destinationName={destinationDisplayName}
                  from={fromParam}
                  to={toParam}
                  isLoading={isLoading}
                  onPageChange={(p) => updateFilters({ page: p })}
                />
              )}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12">
          <Container>
            <div className="h-24 w-full rounded-md bg-(--line)/40 animate-pulse" />
          </Container>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

