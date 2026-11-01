import { relations } from "drizzle-orm/_relations";
import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const menu = pgTable("menu", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const menuVariants = pgTable("menu_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menu.id, { onDelete: "cascade" }),
  size: text("size"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

export const menuItemsRelations = relations(menu, ({ many }) => ({
  variants: many(menuVariants),
}));

export const menuItemVariantsRelations = relations(menuVariants, ({ one }) => ({
  menuItem: one(menu, {
    fields: [menuVariants.menuId],
    references: [menu.id],
  }),
}));
