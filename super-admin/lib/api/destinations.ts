import { apiClient } from "./client";

export interface DestinationItem {
  _id: string;
  name: string;
  slug: string;
  state: string;
  isPilot?: boolean;
  isActive?: boolean;
}

export async function getDestinations(): Promise<DestinationItem[]> {
  return apiClient<DestinationItem[]>("/destinations");
}
