import { apiRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/api";

import type {
  CreateOrderInput,
  Order,
  OrderDetail,
  PaymentInitialization,
} from "./types";

export interface OrderListResult {
  items: Order[];
  pagination?: PaginationMeta;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await apiRequest<Order>("/orders", {
    method: "POST",
    body: input,
  });

  return response.data;
}

export async function listOrders(
  page = 1,
  limit = 10,
): Promise<OrderListResult> {
  const response = await apiRequest<Order[]>("/orders", {
    query: { page, limit },
  });

  return { items: response.data, pagination: response.pagination };
}

export async function getOrder(id: string): Promise<OrderDetail> {
  const response = await apiRequest<OrderDetail>(`/orders/${id}`);
  return response.data;
}

export async function cancelOrder(
  id: string,
  reason?: string,
): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${id}/cancel`, {
    method: "POST",
    body: { reason: reason ?? null },
  });

  return response.data;
}

export async function initializeOrderPayment(
  id: string,
): Promise<PaymentInitialization> {
  const response = await apiRequest<PaymentInitialization>(
    `/orders/${id}/payments/initialize`,
    { method: "POST" },
  );

  return response.data;
}

export async function verifyPayment(reference: string): Promise<OrderDetail> {
  const response = await apiRequest<OrderDetail>("/payments/verify", {
    method: "POST",
    body: { reference },
  });

  return response.data;
}
