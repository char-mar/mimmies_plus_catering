import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";

import { db } from "../config/db";
import { orderStatuses } from "../common/constants/orders";
import type { OrderStatus } from "../common/constants/orders";
import { contacts } from "../db/tables/contacts";
import { orderItems } from "../db/tables/order-items";
import { orders } from "../db/tables/orders";
import { payments } from "../db/tables/payments";
import { users } from "../db/tables/users";

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

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function rangeDates(days: number): string[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const keys: string[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - offset);
    keys.push(utcDayKey(day));
  }

  return keys;
}

function money(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export class AnalyticsService {
  async overview(days: number): Promise<AnalyticsOverview> {
    const dates = rangeDates(days);
    const start = new Date(`${dates[0] ?? utcDayKey(new Date())}T00:00:00.000Z`);

    const [ordersAgg, revenueAgg, pendingAgg, contactAgg, customerAgg] =
      await Promise.all([
        db
          .select({
            total: count(),
            paid: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'PAID')::int`,
          })
          .from(orders)
          .where(gte(orders.createdAt, start)),
        db
          .select({
            revenue: sql<string>`coalesce(sum(${payments.amount}), 0)`,
            successCount: sql<number>`count(*)::int`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.status, "SUCCESS"),
              gte(payments.paidAt, start),
            ),
          ),
        db
          .select({ total: count() })
          .from(payments)
          .where(eq(payments.status, "PENDING")),
        db
          .select({ total: count() })
          .from(contacts)
          .where(eq(contacts.status, "NEW")),
        db
          .select({ total: count() })
          .from(users)
          .where(eq(users.role, "CUSTOMER")),
      ]);

    const orderTotals = ordersAgg[0];
    const revenueTotals = revenueAgg[0];
    const revenue = Number(revenueTotals?.revenue ?? 0);
    const successCount = revenueTotals?.successCount ?? 0;

    const [orderSeriesRows, revenueSeriesRows, statusRows, topRows, channelRows] =
      await Promise.all([
        db
          .select({
            day: sql<string>`to_char(${orders.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
            value: count(),
          })
          .from(orders)
          .where(gte(orders.createdAt, start))
          .groupBy(sql`1`)
          .orderBy(sql`1`),
        db
          .select({
            day: sql<string>`to_char(${payments.paidAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
            value: sql<string>`coalesce(sum(${payments.amount}), 0)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.status, "SUCCESS"),
              gte(payments.paidAt, start),
            ),
          )
          .groupBy(sql`1`)
          .orderBy(sql`1`),
        db
          .select({ status: orders.status, value: count() })
          .from(orders)
          .where(gte(orders.createdAt, start))
          .groupBy(orders.status),
        db
          .select({
            menuName: orderItems.menuName,
            quantity: sql<number>`sum(${orderItems.quantity})::int`,
            revenue: sql<string>`sum(${orderItems.lineTotal})`,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(
            and(gte(orders.createdAt, start), ne(orders.status, "CANCELLED")),
          )
          .groupBy(orderItems.menuName)
          .orderBy(desc(sql`sum(${orderItems.quantity})`))
          .limit(5),
        db
          .select({
            channel: sql<string>`coalesce(${payments.channel}, 'unknown')`,
            value: sql<number>`count(*)::int`,
            amount: sql<string>`coalesce(sum(${payments.amount}), 0)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.status, "SUCCESS"),
              gte(payments.paidAt, start),
            ),
          )
          .groupBy(sql`coalesce(${payments.channel}, 'unknown')`)
          .orderBy(desc(sql`sum(${payments.amount})`)),
      ]);

    const seriesByDay = new Map<string, AnalyticsDay>();

    for (const date of dates) {
      seriesByDay.set(date, { date, orders: 0, revenue: 0 });
    }

    for (const row of orderSeriesRows) {
      const entry = seriesByDay.get(row.day);

      if (entry) {
        entry.orders = Number(row.value);
      }
    }

    for (const row of revenueSeriesRows) {
      const entry = seriesByDay.get(row.day);

      if (entry) {
        entry.revenue = Number(row.value);
      }
    }

    const statusCounts = new Map(
      statusRows.map((row) => [row.status, Number(row.value)] as const),
    );

    return {
      rangeDays: days,
      totals: {
        orders: orderTotals?.total ?? 0,
        paidOrders: orderTotals?.paid ?? 0,
        revenue: money(revenue),
        averageOrderValue: money(
          successCount > 0 ? revenue / successCount : 0,
        ),
        pendingPayments: pendingAgg[0]?.total ?? 0,
        newContacts: contactAgg[0]?.total ?? 0,
        customers: customerAgg[0]?.total ?? 0,
      },
      series: [...seriesByDay.values()],
      orderStatus: orderStatuses.map((status) => ({
        status,
        count: statusCounts.get(status) ?? 0,
      })),
      topItems: topRows.map((row) => ({
        menuName: row.menuName,
        quantity: Number(row.quantity),
        revenue: money(row.revenue),
      })),
      paymentChannels: channelRows.map((row) => ({
        channel: row.channel,
        count: Number(row.value),
        amount: money(row.amount),
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
