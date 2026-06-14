import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const SyncSessionSchema = z.object({
  externalSessionId: z.string().min(1),
  projectName: z.string().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  rawMetadata: z.record(z.unknown()).optional(),
}).openapi('SyncSession');

export const SyncEventSchema = z.object({
  sessionId: z.string().min(1),
  eventTime: z.string().datetime(),
  eventType: z.string().min(1),
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative().default(0),
  cacheReadTokens: z.number().int().nonnegative().default(0),
  cacheWriteTokens: z.number().int().nonnegative().default(0),
  estimatedCost: z.number().nonnegative().default(0),
  payload: z.record(z.unknown()),
}).openapi('SyncEvent');

export const BatchUploadSchema = z.object({
  organizationId: z.string().uuid(),
  machineId: z.string().uuid(),
  provider: z.string().min(1),
  sessions: z.array(SyncSessionSchema).default([]),
  events: z.array(SyncEventSchema).default([]),
}).openapi('BatchUpload');

export const BatchUploadResponseSchema = z.object({
  sessionsInserted: z.number().int().nonnegative(),
  eventsInserted: z.number().int().nonnegative(),
  duplicatesSkipped: z.number().int().nonnegative(),
}).openapi('BatchUploadResponse');

export type SyncSession = z.infer<typeof SyncSessionSchema>;
export type SyncEvent = z.infer<typeof SyncEventSchema>;
export type BatchUpload = z.infer<typeof BatchUploadSchema>;
export type BatchUploadResponse = z.infer<typeof BatchUploadResponseSchema>;