import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { analyticsKeys } from "@/lib/query-keys";

import * as analyticsApi from "./api";

export function useAnalytics(days: number) {
  return useQuery({
    queryKey: analyticsKeys.overview(days),
    queryFn: () => analyticsApi.getAnalytics(days),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
