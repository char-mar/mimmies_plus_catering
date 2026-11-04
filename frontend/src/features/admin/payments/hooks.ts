import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { paymentKeys } from "@/lib/query-keys";

import * as paymentsApi from "./api";
import type { PaymentFilters } from "./types";

export function usePayments(filters: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentsApi.listPayments(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: paymentKeys.summary(),
    queryFn: paymentsApi.getPaymentSummary,
    staleTime: 60 * 1000,
  });
}
