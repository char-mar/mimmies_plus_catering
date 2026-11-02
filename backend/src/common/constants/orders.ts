export const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export const fulfillmentTypes = ["PICKUP", "DELIVERY"] as const;

export type FulfillmentType = (typeof fulfillmentTypes)[number];

export const paymentProviders = ["PAYSTACK"] as const;

export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentRecordStatuses = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "ABANDONED",
  "REFUNDED",
] as const;

export type PaymentRecordStatus = (typeof paymentRecordStatuses)[number];

const orderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
  fulfillmentType: FulfillmentType,
): boolean {
  if (!orderStatusTransitions[from].includes(to)) {
    return false;
  }

  // Delivery-only step; pickup orders go straight from READY to COMPLETED.
  if (to === "OUT_FOR_DELIVERY") {
    return fulfillmentType === "DELIVERY";
  }

  return true;
}

export function nextOrderStatuses(
  from: OrderStatus,
  fulfillmentType: FulfillmentType,
): readonly OrderStatus[] {
  return orderStatusTransitions[from].filter((status) =>
    canTransitionOrder(from, status, fulfillmentType),
  );
}
