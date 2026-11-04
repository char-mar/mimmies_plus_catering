import { z } from "zod";

import {
  paymentProviders,
  paymentRecordStatuses,
} from "../common/constants/orders";

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(paymentRecordStatuses).optional(),
  provider: z.enum(paymentProviders).optional(),
  search: z.string().trim().max(100).optional(),
});

export type ListPaymentsQueryDto = z.infer<typeof listPaymentsQuerySchema>;
