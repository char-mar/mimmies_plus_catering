import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { contactStatuses } from "../../common/constants/contacts";

export const contactStatusEnum = pgEnum("contact_status", contactStatuses);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    subject: varchar("subject", { length: 150 }).notNull(),
    message: text("message").notNull(),
    status: contactStatusEnum("status").notNull().default("NEW"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contacts_status_idx").on(table.status),
    index("contacts_created_at_idx").on(table.createdAt),
  ],
);
