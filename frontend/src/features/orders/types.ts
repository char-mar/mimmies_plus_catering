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

export const paymentRecordStatuses = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "ABANDONED",
  "REFUNDED",
] as const;

export type PaymentRecordStatus = (typeof paymentRecordStatuses)[number];

export interface OrderItem {
  id: string;
  orderId: string;
  menuId: string | null;
  variantId: string | null;
  menuName: string;
  variantSize: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  reference: string;
  provider: "PAYSTACK";
  status: PaymentRecordStatus;
  amount: string;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentType: FulfillmentType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string | null;
  notes: string | null;
  subtotal: string;
  deliveryFee: string;
  total: string;
  currency: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderDetail extends Order {
  payments: Payment[];
}

export interface CreateOrderInput {
  items: { variantId: string; quantity: number }[];
  fulfillmentType: FulfillmentType;
  customerPhone: string;
  deliveryAddress: string | null;
  notes: string | null;
}

export interface PaymentInitialization {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}
