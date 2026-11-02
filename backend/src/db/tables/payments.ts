import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  paymentProviders,
  paymentRecordStatuses,
} from "../../common/constants/orders";
import { orders } from "./orders";

export const paymentProviderEnum = pgEnum(
  "payment_provider",
  paymentProviders,
);
export const paymentRecordStatusEnum = pgEnum(
  "payment_record_status",
  paymentRecordStatuses,
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    provider: paymentProviderEnum("provider").notNull().default("PAYSTACK"),

    status: paymentRecordStatusEnum("status").notNull().default("PENDING"),

    reference: varchar("reference", { length: 100 }).notNull(),

    providerTransactionId: varchar("provider_transaction_id", {
      length: 100,
    }),

    authorizationUrl: text("authorization_url"),
    accessCode: varchar("access_code", { length: 100 }),

    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),

    channel: varchar("channel", { length: 50 }),

    // Normalised copy of the provider response for auditing.
    gatewayResponse: jsonb("gateway_response").$type<
      Record<string, unknown>
    >(),

    paidAt: timestamp("paid_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    uniqueIndex("payments_reference_idx").on(table.reference),
    // At most one open payment attempt per order, so concurrent checkout
    // clicks cannot create two chargeable references.
    uniqueIndex("payments_pending_order_idx")
      .on(table.orderId)
      .where(sql`${table.status} = 'PENDING'`),
  ],
);
