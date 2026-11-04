import { apiRequest } from "@/lib/api";

import type { AnalyticsOverview } from "./types";

export async function getAnalytics(days: number): Promise<AnalyticsOverview> {
  const response = await apiRequest<AnalyticsOverview>("/analytics", {
    query: { days },
  });

  return response.data;
}
