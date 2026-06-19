import { z } from 'zod';

export const SessionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['started_at', 'duration', 'tokens', 'cost']).default('started_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  userId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SessionListQuery = z.infer<typeof SessionListQuerySchema>;

export const SessionDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

export const MachineDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

export function validateParams<T extends z.ZodType>(schema: T, params: unknown): z.infer<T> {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new Error(`Invalid parameters: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}

export function validateQuery<T extends z.ZodType>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}
