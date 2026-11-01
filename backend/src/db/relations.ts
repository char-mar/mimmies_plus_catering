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

    variants: r.many.menuVariants({
      from: r.menu.id,
      to: r.menuVariants.menuId,
    }),

    images: r.many.menuImages({
      from: r.menu.id,
      to: r.menuImages.menuId,
    }),
  },

  menuVariants: {
    menu: r.one.menu({
      from: r.menuVariants.menuId,
      to: r.menu.id,
    }),

    images: r.many.menuImages({
      from: r.menuVariants.id,
      to: r.menuImages.variantId,
    }),
  },

  menuImages: {
    menu: r.one.menu({
      from: r.menuImages.menuId,
      to: r.menu.id,
    }),

    variant: r.one.menuVariants({
      from: r.menuImages.variantId,
      to: r.menuVariants.id,
    }),
  },
}));
