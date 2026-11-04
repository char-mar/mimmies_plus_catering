import type { PaymentRecordStatus } from "@/features/orders/types";

export interface PaymentRow {
  id: string;
  orderId: string;
  reference: string;
  provider: string;
  status: PaymentRecordStatus;
  amount: string;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
}

export interface PaymentSummary {
  collected: string;
  successCount: number;
  pending: string;
  pendingCount: number;
  failedCount: number;
  abandonedCount: number;
  refunded: string;
  refundedCount: number;
  totalCount: number;
}

export interface PaymentFilters {
  page: number;
  limit: number;
  status?: PaymentRecordStatus | "";
  search?: string;
}
