import type { BadgeTone } from "@/components/ui";

import type {
  FulfillmentType,
  OrderStatus,
  PaymentRecordStatus,
  PaymentStatus,
} from "./types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  PREPARING: "brand",
  READY: "green",
  OUT_FOR_DELIVERY: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  PENDING: "amber",
  PAID: "green",
  FAILED: "red",
  REFUNDED: "stone",
};

export const PAYMENT_RECORD_LABELS: Record<PaymentRecordStatus, string> = {
  PENDING: "Pending",
  SUCCESS: "Successful",
  FAILED: "Failed",
  ABANDONED: "Abandoned",
  REFUNDED: "Refunded",
};

export const PAYMENT_RECORD_TONES: Record<PaymentRecordStatus, BadgeTone> = {
  PENDING: "amber",
  SUCCESS: "green",
  FAILED: "red",
  ABANDONED: "stone",
  REFUNDED: "stone",
};

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  PICKUP: "Pickup",
  DELIVERY: "Delivery",
};

// Mirrors the backend state machine so admins only see valid next steps.
const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function nextOrderStatuses(
  from: OrderStatus,
  fulfillmentType: FulfillmentType,
): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from].filter(
    (status) => status !== "OUT_FOR_DELIVERY" || fulfillmentType === "DELIVERY",
  );
}

export function isOrderPayable(order: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}): boolean {
  return (
    order.paymentStatus !== "PAID" &&
    order.status !== "CANCELLED" &&
    order.status !== "COMPLETED"
  );
}

export function isOrderCancellable(order: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}): boolean {
  return (
    order.paymentStatus !== "PAID" &&
    (order.status === "PENDING" || order.status === "CONFIRMED")
  );
}
