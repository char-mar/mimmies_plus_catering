import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  categories: {
    menu: r.many.menu({
      from: r.categories.id,
      to: r.menu.categoryId,
    }),
  },

  menu: {
    category: r.one.categories({
      from: r.menu.categoryId,
      to: r.categories.id,
    }),
  },
}));
