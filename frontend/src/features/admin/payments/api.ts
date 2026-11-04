import { apiRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/api";

import type { PaymentFilters, PaymentRow, PaymentSummary } from "./types";

export interface PaymentListResult {
  items: PaymentRow[];
  pagination?: PaginationMeta;
}

export async function listPayments(
  filters: PaymentFilters,
): Promise<PaymentListResult> {
  const response = await apiRequest<PaymentRow[]>("/payments", {
    query: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      search: filters.search?.trim() || undefined,
    },
  });

  return { items: response.data, pagination: response.pagination };
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  const response = await apiRequest<PaymentSummary>("/payments/summary");
  return response.data;
}
