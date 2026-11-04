import type { OrderStatus } from "@/features/orders/types";

export interface AnalyticsTotals {
  orders: number;
  paidOrders: number;
  revenue: string;
  averageOrderValue: string;
  pendingPayments: number;
  newContacts: number;
  customers: number;
}

export interface AnalyticsDay {
  date: string;
  orders: number;
  revenue: number;
}

export interface AnalyticsStatusSlice {
  status: OrderStatus;
  count: number;
}

export interface AnalyticsTopItem {
  menuName: string;
  quantity: number;
  revenue: string;
}

export interface AnalyticsChannel {
  channel: string;
  count: number;
  amount: string;
}

export interface AnalyticsOverview {
  rangeDays: number;
  totals: AnalyticsTotals;
  series: AnalyticsDay[];
  orderStatus: AnalyticsStatusSlice[];
  topItems: AnalyticsTopItem[];
  paymentChannels: AnalyticsChannel[];
}
