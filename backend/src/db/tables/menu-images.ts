import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { menu } from "./menu";
import { menuVariants } from "./menu";

export const menuImages = pgTable(
  "menu_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    menuId: uuid("menu_id").references(() => menu.id, {
      onDelete: "cascade",
    }),

    variantId: uuid("variant_id").references(() => menuVariants.id, {
      onDelete: "cascade",
    }),

    url: text("url").notNull(),
    publicId: text("public_id").notNull(),

    altText: text("alt_text"),

    isPrimary: boolean("is_primary").notNull().default(false),

    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "menu_images_owner_check",
      sql`(
        (${table.menuId} IS NOT NULL AND ${table.variantId} IS NULL)
        OR
        (${table.menuId} IS NULL AND ${table.variantId} IS NOT NULL)
      )`,
    ),
  ],
);
