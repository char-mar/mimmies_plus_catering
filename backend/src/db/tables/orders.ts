import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  fulfillmentTypes,
  orderStatuses,
  paymentStatuses,
} from "../../common/constants/orders";
import { users } from "./users";

export const orderStatusEnum = pgEnum("order_status", orderStatuses);
export const paymentStatusEnum = pgEnum("payment_status", paymentStatuses);
export const fulfillmentTypeEnum = pgEnum(
  "fulfillment_type",
  fulfillmentTypes,
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderNumber: varchar("order_number", { length: 40 })
      .notNull()
      .unique(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    status: orderStatusEnum("status").notNull().default("PENDING"),

    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),

    fulfillmentType: fulfillmentTypeEnum("fulfillment_type").notNull(),

    // Contact and fulfilment details are snapshotted so historical orders keep
    // their original data even if the user or menu changes later.
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    deliveryAddress: text("delivery_address"),
    notes: text("notes"),

    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    deliveryFee: numeric("delivery_fee", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("GHS"),

    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_user_created_idx").on(table.userId, table.createdAt),
    index("orders_status_idx").on(table.status),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);
