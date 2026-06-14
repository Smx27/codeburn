import { z } from 'zod';

export const PeriodEnum = z.enum(['24h', '7d', '30d', '90d', '1y']);

export const GranularityEnum = z.enum(['daily', 'weekly', 'monthly']);

export const LimitNumber = z.coerce.number().int().min(1).max(100).default(20);

export const OverviewQuerySchema = z.object({
  period: PeriodEnum.default('30d'),
});

export const AnalyticsQuerySchema = z.object({
  period: PeriodEnum.default('30d'),
  limit: LimitNumber.optional(),
});

export const TrendQuerySchema = z.object({
  period: PeriodEnum.default('30d'),
  granularity: GranularityEnum.default('daily'),
});

export function validateQuery<T extends z.ZodType>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}