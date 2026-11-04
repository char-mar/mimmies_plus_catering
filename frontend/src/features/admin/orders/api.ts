import { apiRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/api";
import type {
  FulfillmentType,
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/features/orders/types";

export interface AdminOrderFilters {
  page: number;
  limit: number;
  status?: OrderStatus | "";
  paymentStatus?: PaymentStatus | "";
  fulfillmentType?: FulfillmentType | "";
}

export interface AdminOrderListResult {
  items: Order[];
  pagination?: PaginationMeta;
}

export async function listAdminOrders(
  filters: AdminOrderFilters,
): Promise<AdminOrderListResult> {
  const response = await apiRequest<Order[]>("/orders", {
    query: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      paymentStatus: filters.paymentStatus || undefined,
      fulfillmentType: filters.fulfillmentType || undefined,
    },
  });

  return { items: response.data, pagination: response.pagination };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status, note: note?.trim() ? note.trim() : null },
  });

  return response.data;
}
