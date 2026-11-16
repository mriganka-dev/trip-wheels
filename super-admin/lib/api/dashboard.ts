import { apiClient } from "./client";
import type { DashboardCounts } from "@/types/dashboard";

export async function getDashboard(): Promise<DashboardCounts> {
  return apiClient<DashboardCounts>("/admin/dashboard");
}
