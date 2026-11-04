import { z } from "zod";

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
});

export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;
