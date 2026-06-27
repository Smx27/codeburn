import { z } from 'zod';

const SortByEnum = z.enum(['started_at', 'startedAt', 'duration', 'tokens', 'cost']);
const SortDirEnum = z.enum(['asc', 'desc']);

export const SessionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: SortByEnum.default('started_at').transform((v) => {
    const map: Record<string, string> = { startedAt: 'started_at' };
    return map[v] ?? v;
  }),
  sortDir: SortDirEnum.default('desc'),
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
    const err = new Error(`Invalid parameters: ${result.error.errors.map(e => e.message).join(', ')}`);
    (err as any).statusCode = 400;
    throw err;
  }
  return result.data;
}

export function validateQuery<T extends z.ZodType>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    const err = new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
    (err as any).statusCode = 400;
    throw err;
  }
  return result.data;
}
