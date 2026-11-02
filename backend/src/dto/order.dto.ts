import { z } from "zod";

import {
  fulfillmentTypes,
  orderStatuses,
  paymentStatuses,
} from "../common/constants/orders";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "A phone number is required.")
  .max(20)
  .regex(
    /^\+?[0-9\s\-()]{7,20}$/,
    "Enter a valid phone number, for example 024 000 0000.",
  );

const orderItemSchema = z.object({
  variantId: z.uuid("A valid menu variant is required."),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(99, "Quantity must be at most 99."),
});

export const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1).max(50),
    fulfillmentType: z.enum(fulfillmentTypes),
    customerPhone: phoneSchema,
    deliveryAddress: z
      .string()
      .trim()
      .min(5, "A delivery address is required for delivery orders.")
      .max(500)
      .nullish()
      .transform((value) => (value ? value : null)),
    notes: z
      .string()
      .trim()
      .max(1000)
      .nullish()
      .transform((value) => (value ? value : null)),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === "DELIVERY" && !data.deliveryAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "A delivery address is required for delivery orders.",
      });
    }

    const totalQuantity = data.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    if (totalQuantity > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "An order can contain at most 100 items.",
      });
    }
  });

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
  note: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(orderStatuses).optional(),
  paymentStatus: z.enum(paymentStatuses).optional(),
  fulfillmentType: z.enum(fulfillmentTypes).optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().trim().min(6).max(100),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQueryDto = z.infer<typeof listOrdersQuerySchema>;
export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
