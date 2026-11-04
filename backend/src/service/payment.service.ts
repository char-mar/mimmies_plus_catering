import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "../config/db";
import { orders } from "../db/tables/orders";
import { payments } from "../db/tables/payments";
import type { PaginatedResponse } from "../common/types/pagination.types";
import { buildPagination, getPagination } from "../common/utils/pagination";
import type { ListPaymentsQueryDto } from "../dto/payment.dto";

export interface PaymentListItem {
  id: string;
  orderId: string;
  reference: string;
  provider: string;
  status: string;
  amount: string;
  currency: string;
  channel: string | null;
  paidAt: Date | null;
  createdAt: Date;
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

export class PaymentService {
  async findAll(
    query: ListPaymentsQueryDto,
  ): Promise<PaginatedResponse<PaymentListItem>> {
    const pagination = getPagination(query.page, query.limit);
    const filters: SQL[] = [];

    if (query.status) {
      filters.push(eq(payments.status, query.status));
    }

    if (query.provider) {
      filters.push(eq(payments.provider, query.provider));
    }

    if (query.search) {
      const term = `%${query.search}%`;

      const search = or(
        ilike(payments.reference, term),
        ilike(orders.orderNumber, term),
        ilike(orders.customerName, term),
        ilike(orders.customerEmail, term),
      );

      if (search) {
        filters.push(search);
      }
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(where);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        reference: payments.reference,
        provider: payments.provider,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        channel: payments.channel,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(where)
      .orderBy(desc(payments.createdAt), desc(payments.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return {
      items: rows,
      pagination: buildPagination(total, pagination.page, pagination.limit),
    };
  }

  async summary(): Promise<PaymentSummary> {
    const [row] = await db
      .select({
        collected: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'SUCCESS'), 0)`,
        successCount: sql<number>`count(*) filter (where ${payments.status} = 'SUCCESS')::int`,
        pending: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'PENDING'), 0)`,
        pendingCount: sql<number>`count(*) filter (where ${payments.status} = 'PENDING')::int`,
        failedCount: sql<number>`count(*) filter (where ${payments.status} = 'FAILED')::int`,
        abandonedCount: sql<number>`count(*) filter (where ${payments.status} = 'ABANDONED')::int`,
        refunded: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'REFUNDED'), 0)`,
        refundedCount: sql<number>`count(*) filter (where ${payments.status} = 'REFUNDED')::int`,
        totalCount: count(),
      })
      .from(payments);

    return (
      row ?? {
        collected: "0.00",
        successCount: 0,
        pending: "0.00",
        pendingCount: 0,
        failedCount: 0,
        abandonedCount: 0,
        refunded: "0.00",
        refundedCount: 0,
        totalCount: 0,
      }
    );
  }
}

export const paymentService = new PaymentService();
