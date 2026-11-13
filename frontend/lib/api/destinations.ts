import { apiClient } from "./client";
import { serverFetch } from "./server";
import type { Destination } from "@/types/destination";

export async function getActiveDestinations(): Promise<Destination[]> {
  return apiClient<Destination[]>("/destinations", {
    method: "GET",
  });
}

export async function serverGetActiveDestinations(): Promise<Destination[]> {
  return serverFetch<Destination[]>("/destinations", {
    method: "GET",
    revalidate: 3600,
  });
}

export async function serverGetDestinationBySlug(slug: string): Promise<Destination> {
  const destinations = await serverGetActiveDestinations();
  const match = destinations.find(
    (d) => d.slug.toLowerCase() === slug.toLowerCase()
  );
  if (!match) {
    throw new Error(`Destination not found: ${slug}`);
  }
  return match;
}

