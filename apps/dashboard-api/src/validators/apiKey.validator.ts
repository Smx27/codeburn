import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['read', 'write', 'admin']).default('write'),
  expiresAt: z.string().datetime().optional(),
});

export const ApiKeyParamsSchema = z.object({
  id: z.string().uuid(),
});

export function validateBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const err = new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
    (err as any).statusCode = 400;
    throw err;
  }
  return result.data;
}
