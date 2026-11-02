import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { menu, menuVariants } from "./menu";
import { orders } from "./orders";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    // Kept for reporting; the snapshot columns below survive menu deletions.
    menuId: uuid("menu_id").references(() => menu.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => menuVariants.id, {
      onDelete: "set null",
    }),

    menuName: varchar("menu_name", { length: 150 }).notNull(),
    variantSize: varchar("variant_size", { length: 50 }),

    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_non_negative", sql`${table.unitPrice} >= 0`),
  ],
);
