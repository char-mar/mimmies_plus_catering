import { randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "../config/db";
import { env } from "../config/env";
import { isManagementRole } from "../common/constants/roles";
import {
  canTransitionOrder,
  type OrderStatus,
} from "../common/constants/orders";
import { paystackService } from "../common/services/paystack.service";
import { isUniqueViolation } from "../common/utils/db-errors";
import { fromMinorUnits, toMinorUnits } from "../common/utils/money";
import { buildPagination, getPagination } from "../common/utils/pagination";
import { menu, menuVariants } from "../db/tables/menu";
import { orderItems } from "../db/tables/order-items";
import { orderStatusHistory } from "../db/tables/order-status-history";
import { orders } from "../db/tables/orders";
import { payments } from "../db/tables/payments";
import type { AuthUser } from "../common/types/auth.types";
import type { PaginatedResponse } from "../common/types/pagination.types";
import type {
  CancelOrderDto,
  CreateOrderDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
} from "../dto/order.dto";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from "../errors/app-error";

type OrderRecord = typeof orders.$inferSelect;
type OrderItemRecord = typeof orderItems.$inferSelect;
type PaymentRecord = typeof payments.$inferSelect;

type PublicPayment = Pick<
  PaymentRecord,
  | "id"
  | "reference"
  | "provider"
  | "status"
  | "amount"
  | "currency"
  | "channel"
  | "paidAt"
  | "createdAt"
>;

export interface OrderSummary extends OrderRecord {
  items: OrderItemRecord[];
}

export interface OrderDetail extends OrderSummary {
  payments: PublicPayment[];
}

export interface PaymentInitialization {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(4).toString("hex").toUpperCase();

  return `MP-${date}-${suffix}`;
}

function generatePaymentReference(orderNumber: string): string {
  return `${orderNumber}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function paystackCallbackUrl(): string {
  return (
    env.PAYSTACK_CALLBACK_URL ??
    `${env.FRONTEND_URL.replace(/\/+$/, "")}/orders/confirmation`
  );
}

function providerPaidAt(value: string | null, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export class OrderService {
  async create(user: AuthUser, dto: CreateOrderDto): Promise<OrderSummary> {
    const quantities = new Map<string, number>();

    for (const item of dto.items) {
      quantities.set(
        item.variantId,
        (quantities.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    const variantIds = [...quantities.keys()];

    const rows = await db
      .select({
        id: menuVariants.id,
        menuId: menuVariants.menuId,
        size: menuVariants.size,
        price: menuVariants.price,
        menuName: menu.name,
      })
      .from(menuVariants)
      .innerJoin(menu, eq(menuVariants.menuId, menu.id))
      .where(inArray(menuVariants.id, variantIds));

    if (rows.length !== variantIds.length) {
      throw new BadRequestError(
        "One or more selected menu items are no longer available.",
      );
    }

    const rowsById = new Map(rows.map((row) => [row.id, row]));

    const pricedItems = variantIds.map((variantId) => {
      const row = rowsById.get(variantId);
      const quantity = quantities.get(variantId);

      if (!row || !quantity) {
        throw new BadRequestError(
          "One or more selected menu items are no longer available.",
        );
      }

      const lineMinor = toMinorUnits(row.price) * quantity;

      return {
        lineMinor,
        item: {
          menuId: row.menuId,
          variantId: row.id,
          menuName: row.menuName,
          variantSize: row.size,
          unitPrice: row.price,
          quantity,
          lineTotal: fromMinorUnits(lineMinor),
        },
      };
    });

    const subtotalMinor = pricedItems.reduce(
      (total, entry) => total + entry.lineMinor,
      0,
    );
    const deliveryMinor =
      dto.fulfillmentType === "DELIVERY" ? toMinorUnits(env.DELIVERY_FEE) : 0;
    const totalMinor = subtotalMinor + deliveryMinor;
    const now = new Date();

    return db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: generateOrderNumber(),
          userId: user.id,
          status: "PENDING",
          paymentStatus: "PENDING",
          fulfillmentType: dto.fulfillmentType,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: dto.customerPhone,
          deliveryAddress: dto.deliveryAddress,
          notes: dto.notes,
          subtotal: fromMinorUnits(subtotalMinor),
          deliveryFee: fromMinorUnits(deliveryMinor),
          total: fromMinorUnits(totalMinor),
          currency: env.CURRENCY,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!order) {
        throw new Error("Failed to create order.");
      }

      const insertedItems = await tx
        .insert(orderItems)
        .values(
          pricedItems.map(({ item }) => ({
            orderId: order.id,
            ...item,
            createdAt: now,
          })),
        )
        .returning();

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "PENDING",
        note: "Order placed.",
        changedByUserId: user.id,
        createdAt: now,
      });

      return { ...order, items: insertedItems };
    });
  }

  async findAll(
    user: AuthUser,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedResponse<OrderSummary>> {
    const pagination = getPagination(query.page, query.limit);
    const filters: SQL[] = [];

    if (!isManagementRole(user.role)) {
      filters.push(eq(orders.userId, user.id));
    }

    if (query.status) {
      filters.push(eq(orders.status, query.status));
    }

    if (query.paymentStatus) {
      filters.push(eq(orders.paymentStatus, query.paymentStatus));
    }

    if (query.fulfillmentType) {
      filters.push(eq(orders.fulfillmentType, query.fulfillmentType));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(orders)
      .where(where);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const itemsByOrder = await this.loadItems(rows.map((order) => order.id));

    return {
      items: rows.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
      })),
      pagination: buildPagination(total, pagination.page, pagination.limit),
    };
  }

  async findById(user: AuthUser, orderId: string): Promise<OrderDetail> {
    const order = await this.getOwnedOrder(user, orderId);

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.createdAt));

    const paymentRows = await db
      .select({
        id: payments.id,
        reference: payments.reference,
        provider: payments.provider,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        channel: payments.channel,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.createdAt));

    return { ...order, items, payments: paymentRows };
  }

  async updateStatus(
    actorId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderSummary> {
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order) {
        throw new NotFoundError("Order not found.");
      }

      if (order.status === dto.status) {
        if (dto.note) {
          await tx.insert(orderStatusHistory).values({
            orderId: order.id,
            status: dto.status,
            note: dto.note,
            changedByUserId: actorId,
          });
        }
      } else {
        if (
          !canTransitionOrder(order.status, dto.status, order.fulfillmentType)
        ) {
          throw new BadRequestError(
            `Order cannot move from ${order.status} to ${dto.status}.`,
          );
        }

        const now = new Date();

        await tx
          .update(orders)
          .set({
            status: dto.status,
            updatedAt: now,
            ...(dto.status === "CANCELLED" ? { cancelledAt: now } : {}),
          })
          .where(eq(orders.id, order.id));

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          status: dto.status,
          note:
            dto.note ??
            (dto.status === "CANCELLED"
              ? "Cancelled by an administrator."
              : null),
          changedByUserId: actorId,
          createdAt: now,
        });

        if (dto.status === "CANCELLED") {
          await tx
            .update(payments)
            .set({ status: "ABANDONED", updatedAt: now })
            .where(
              and(
                eq(payments.orderId, order.id),
                eq(payments.status, "PENDING"),
              ),
            );
        }
      }

      const [updated] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, order.id))
        .limit(1);

      if (!updated) {
        throw new NotFoundError("Order not found.");
      }

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .orderBy(asc(orderItems.createdAt));

      return { ...updated, items };
    });
  }

  async cancel(
    user: AuthUser,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<OrderSummary> {
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
        .for("update");

      if (!order) {
        throw new NotFoundError("Order not found.");
      }

      if (order.status === "CANCELLED") {
        throw new ConflictError("This order is already cancelled.");
      }

      if (order.paymentStatus === "PAID") {
        throw new ConflictError(
          "Paid orders can only be cancelled by an administrator.",
        );
      }

      if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
        throw new ConflictError("This order can no longer be cancelled.");
      }

      const now = new Date();

      await tx
        .update(orders)
        .set({ status: "CANCELLED", cancelledAt: now, updatedAt: now })
        .where(eq(orders.id, order.id));

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "CANCELLED",
        note: dto.reason ?? "Cancelled by customer.",
        changedByUserId: user.id,
        createdAt: now,
      });

      await tx
        .update(payments)
        .set({ status: "ABANDONED", updatedAt: now })
        .where(
          and(eq(payments.orderId, order.id), eq(payments.status, "PENDING")),
        );

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .orderBy(asc(orderItems.createdAt));

      return {
        ...order,
        status: "CANCELLED" as const,
        cancelledAt: now,
        updatedAt: now,
        items,
      };
    });
  }

  async initializePayment(
    user: AuthUser,
    orderId: string,
  ): Promise<PaymentInitialization> {
    if (!paystackService.isConfigured()) {
      throw new ServiceUnavailableError(
        "Online payments are not configured. Please contact support.",
      );
    }

    const order = await this.getOwnedOrder(user, orderId);

    if (order.paymentStatus === "PAID") {
      throw new ConflictError("This order has already been paid.");
    }

    if (order.status === "CANCELLED" || order.status === "COMPLETED") {
      throw new ConflictError("This order can no longer be paid.");
    }

    let payment = await this.findPendingPayment(order.id);

    if (payment?.authorizationUrl) {
      return {
        reference: payment.reference,
        authorizationUrl: payment.authorizationUrl,
        accessCode: payment.accessCode ?? "",
      };
    }

    if (!payment) {
      try {
        const [created] = await db
          .insert(payments)
          .values({
            orderId: order.id,
            provider: "PAYSTACK",
            status: "PENDING",
            reference: generatePaymentReference(order.orderNumber),
            amount: order.total,
            currency: order.currency,
          })
          .returning();

        if (!created) {
          throw new Error("Failed to create a payment attempt.");
        }

        payment = created;
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }

        // Another checkout request won the race; reuse its open attempt.
        payment = await this.findPendingPayment(order.id);
      }
    }

    if (!payment) {
      throw new Error("Failed to create a payment attempt.");
    }

    try {
      const initialized = await paystackService.initializeTransaction({
        email: order.customerEmail,
        amount: toMinorUnits(order.total),
        currency: order.currency,
        reference: payment.reference,
        callbackUrl: paystackCallbackUrl(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
        },
      });

      await db
        .update(payments)
        .set({
          authorizationUrl: initialized.authorizationUrl,
          accessCode: initialized.accessCode,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return {
        reference: initialized.reference,
        authorizationUrl: initialized.authorizationUrl,
        accessCode: initialized.accessCode,
      };
    } catch (error) {
      await db
        .update(payments)
        .set({
          status: "FAILED",
          gatewayResponse: {
            error:
              error instanceof Error
                ? error.message
                : "Payment initialization failed.",
          },
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      throw error;
    }
  }

  async verifyPayment(user: AuthUser, reference: string): Promise<OrderDetail> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.reference, reference))
      .limit(1);

    if (!payment) {
      throw new NotFoundError("Payment not found.");
    }

    const order = await this.getOwnedOrder(user, payment.orderId);

    if (payment.status === "SUCCESS") {
      return this.findById(user, order.id);
    }

    const transaction = await paystackService.verifyTransaction(reference);

    if (
      transaction.reference !== reference ||
      transaction.currency !== payment.currency ||
      transaction.amount !== toMinorUnits(payment.amount)
    ) {
      console.error(
        `[payments] Verification mismatch for ${reference}: expected ${payment.currency} ${toMinorUnits(payment.amount)}, received ${transaction.currency} ${transaction.amount}.`,
      );
      throw new BadRequestError(
        "Payment details do not match this order. Please contact support.",
      );
    }

    if (transaction.status !== "success") {
      await db
        .update(payments)
        .set({
          status: transaction.status === "abandoned" ? "ABANDONED" : "FAILED",
          gatewayResponse: {
            id: transaction.id,
            status: transaction.status,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            channel: transaction.channel,
            paidAt: transaction.paidAt,
          },
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      throw new BadRequestError("Payment was not successful.");
    }

    await this.recordSuccessfulPayment(payment.id, transaction);

    return this.findById(user, order.id);
  }

  async handlePaystackWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<void> {
    if (!paystackService.isConfigured()) {
      throw new ServiceUnavailableError("Online payments are not configured.");
    }

    if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedError("Invalid webhook signature.");
    }

    const event = paystackService.parseWebhookEvent(rawBody);

    if (!event) {
      throw new BadRequestError("Malformed webhook payload.");
    }

    // Acknowledge every other event so Paystack does not keep retrying.
    if (event.event !== "charge.success" || !event.transaction) {
      return;
    }

    const transaction = event.transaction;

    const [payment] = await db
      .select({
        id: payments.id,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
      })
      .from(payments)
      .where(eq(payments.reference, transaction.reference))
      .limit(1);

    if (!payment) {
      console.warn(
        `[paystack] Webhook for unknown reference ${transaction.reference}.`,
      );
      return;
    }

    if (payment.status === "SUCCESS") {
      return;
    }

    if (
      transaction.amount !== toMinorUnits(payment.amount) ||
      transaction.currency !== payment.currency
    ) {
      console.error(
        `[paystack] Webhook amount/currency mismatch for ${transaction.reference}; order was not marked paid.`,
      );
      return;
    }

    await this.recordSuccessfulPayment(payment.id, transaction);
  }

  private async recordSuccessfulPayment(
    paymentId: string,
    transaction: {
      id: number;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      channel: string | null;
      paidAt: string | null;
      gatewayResponse: string | null;
    },
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .for("update");

      if (!payment || payment.status === "SUCCESS") {
        return;
      }

      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .for("update");

      if (!order) {
        return;
      }

      const now = new Date();
      const paidAt = providerPaidAt(transaction.paidAt, now);

      await tx
        .update(payments)
        .set({
          status: "SUCCESS",
          providerTransactionId: String(transaction.id),
          channel: transaction.channel,
          gatewayResponse: {
            id: transaction.id,
            status: transaction.status,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            channel: transaction.channel,
            paidAt: transaction.paidAt,
            gatewayResponse: transaction.gatewayResponse,
          },
          paidAt,
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id));

      const shouldConfirm = order.status === "PENDING";

      await tx
        .update(orders)
        .set({
          paymentStatus: "PAID",
          ...(shouldConfirm ? { status: "CONFIRMED" as const } : {}),
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));

      if (shouldConfirm) {
        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          status: "CONFIRMED",
          note: "Payment received.",
          createdAt: now,
        });
      } else if (order.status === "CANCELLED") {
        console.warn(
          `[paystack] Payment received for cancelled order ${order.orderNumber}; refund required.`,
        );
        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          status: "CANCELLED",
          note: "Payment received after cancellation; refund required.",
          createdAt: now,
        });
      }
    });
  }

  private async getOwnedOrder(
    user: AuthUser,
    orderId: string,
  ): Promise<OrderRecord> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order || (!isManagementRole(user.role) && order.userId !== user.id)) {
      // Hide other customers' orders rather than revealing that they exist.
      throw new NotFoundError("Order not found.");
    }

    return order;
  }

  private async findPendingPayment(
    orderId: string,
  ): Promise<PaymentRecord | null> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, "PENDING")))
      .limit(1);

    return payment ?? null;
  }

  private async loadItems(
    orderIds: string[],
  ): Promise<Map<string, OrderItemRecord[]>> {
    const grouped = new Map<string, OrderItemRecord[]>();

    if (orderIds.length === 0) {
      return grouped;
    }

    const rows = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(asc(orderItems.createdAt));

    for (const row of rows) {
      const list = grouped.get(row.orderId) ?? [];
      list.push(row);
      grouped.set(row.orderId, list);
    }

    return grouped;
  }
}

// Kept alongside the service for tests and future admin tooling.
export type { OrderStatus };

export const orderService = new OrderService();
