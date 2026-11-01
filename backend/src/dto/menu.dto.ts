import { z } from "zod";

// Prices are kept as decimal strings so they can be stored in a numeric(10, 2)
// column without floating point rounding issues.
const priceSchema = z
  .union([z.string(), z.number()])
  .transform((value) =>
    typeof value === "number" ? value.toFixed(2) : value.trim(),
  )
  .refine(
    (value) => /^\d{1,8}(\.\d{1,2})?$/.test(value) && Number(value) > 0,
    "Price must be a positive amount with up to two decimal places.",
  );

const variantSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .nullish()
    .transform((value) => value ?? null),
  price: priceSchema,
});

const updateVariantSchema = variantSchema.extend({
  id: z.uuid().optional(),
});

const descriptionSchema = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((value) => (value ? value : null));

export const createMenuSchema = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(1, "Name is required.").max(150),
  description: descriptionSchema,
  variants: z.array(variantSchema).max(20).optional().default([]),
});

export const updateMenuSchema = z.object({
  categoryId: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(150).optional(),
  description: descriptionSchema.optional(),
  variants: z.array(updateVariantSchema).max(20).optional(),
});

export type CreateMenuVariantDto = z.infer<typeof variantSchema>;
export type UpdateMenuVariantDto = z.infer<typeof updateVariantSchema>;
export type CreateMenuDto = z.infer<typeof createMenuSchema>;
export type UpdateMenuDto = z.infer<typeof updateMenuSchema>;
