import { apiClient } from "./client";
import type { Destination } from "@/types/destination";

export async function getActiveDestinations(): Promise<Destination[]> {
  return apiClient<Destination[]>("/destinations");
}
