// Sync Engine Types - Consumes existing ParsedProviderCall from OSS parsers

import type { ParsedProviderCall, ToolCall } from '../providers/oss-types.js';

// Re-export the OSS parser output type
export type { ParsedProviderCall, ToolCall };

export interface SyncSession {
  externalSessionId: string;
  projectName: string;
  startedAt: string;
  endedAt?: string;
  rawMetadata?: Record<string, unknown>;
}

export interface SyncEvent {
  sessionId: string;
  eventTime: string;
  eventType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCost: number;
  payload: ParsedProviderCall;
}

export interface BatchUploadPayload {
  organizationId: string;
  machineId: string;
  provider: string;
  sessions: SyncSession[];
  events: SyncEvent[];
}

export interface BatchUploadResponse {
  sessionsInserted: number;
  eventsInserted: number;
  duplicatesSkipped: number;
}

export interface SyncStateRecord {
  organizationId: string;
  machineId: string;
  provider: string;
  sourceIdentifier: string;
  lastProcessedAt?: Date;
  lastHash?: string;
  updatedAt: Date;
}

export interface SourceStats {
  path: string;
  size: number;
  checksum: string;
  modifiedAt: Date;
}

export interface SyncConfig {
  organizationId: string;
  machineId: string;
  apiUrl: string;
  apiKey: string;
  batchSize?: number;
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface HistoricalSyncResult {
  providersProcessed: number;
  sessionsSynced: number;
  eventsSynced: number;
  errors: string[];
}

export interface IncrementalSyncResult {
  sourcesChecked: number;
  sourcesSynced: number;
  eventsSynced: number;
  errors: string[];
}

export interface ProviderAdapter {
  name: string;
  adaptSession(call: ParsedProviderCall): SyncSession;
  adaptEvent(call: ParsedProviderCall): SyncEvent;
}

export interface LogContext {
  operationId: string;
  organizationId: string;
  machineId: string;
  provider: string;
  sourcePath?: string;
  event?: string;
}