import pino from 'pino';
import type { LogContext } from '../types/sync.types.js';

const baseLogger = pino({
  level: process.env.SYNC_LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'aiinsight-sync-engine',
    version: process.env.npm_package_version || '0.1.0',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const syncLogger = baseLogger;

export function createOperationLogger(context: LogContext): pino.Logger {
  return baseLogger.child({
    operationId: context.operationId,
    organizationId: context.organizationId,
    machineId: context.machineId,
    provider: context.provider,
    sourcePath: context.sourcePath,
  });
}

export function logOperationStart(logger: pino.Logger, operation: string, details?: Record<string, unknown>): void {
  logger.info({ operation, event: 'start', ...details }, `${operation} started`);
}

export function logOperationComplete(logger: pino.Logger, operation: string, details?: Record<string, unknown>): void {
  logger.info({ operation, event: 'complete', ...details }, `${operation} completed`);
}

export function logOperationError(logger: pino.Logger, operation: string, error: Error, details?: Record<string, unknown>): void {
  logger.error({ operation, event: 'error', error: error.message, stack: error.stack, ...details }, `${operation} failed`);
}

export function logBatchPrepared(logger: pino.Logger, sessionCount: number, eventCount: number): void {
  logger.info({ operation: 'batch_prepared', event: 'batch_prepared', sessionCount, eventCount }, 'Batch prepared for upload');
}

export function logBatchUploaded(logger: pino.Logger, response: { sessionsInserted: number; eventsInserted: number; duplicatesSkipped: number }): void {
  logger.info({ operation: 'batch_uploaded', event: 'batch_uploaded', ...response }, 'Batch uploaded successfully');
}

export function logBatchFailed(logger: pino.Logger, error: Error, attempt: number, maxRetries: number): void {
  logger.error({ operation: 'batch_failed', event: 'batch_failed', error: error.message, attempt, maxRetries }, 'Batch upload failed');
}

export function logRetryStarted(logger: pino.Logger, attempt: number, maxRetries: number): void {
  logger.warn({ operation: 'retry_started', event: 'retry_started', attempt, maxRetries }, 'Retrying batch upload');
}

export function logRetryCompleted(logger: pino.Logger, attempt: number): void {
  logger.info({ operation: 'retry_completed', event: 'retry_completed', attempt }, 'Retry completed successfully');
}

export function logChecksumCalculated(logger: pino.Logger, sourcePath: string, checksum: string): void {
  logger.debug({ operation: 'checksum_calculated', event: 'checksum_calculated', sourcePath, checksum }, 'File checksum calculated');
}

export function logSourceDiscovered(logger: pino.Logger, sourcePath: string, provider: string): void {
  logger.info({ operation: 'source_discovered', event: 'source_discovered', sourcePath, provider }, 'Source file discovered');
}

export function logProviderDetected(logger: pino.Logger, provider: string, sessionCount: number): void {
  logger.info({ operation: 'provider_detected', event: 'provider_detected', provider, sessionCount }, 'Provider sessions discovered');
}

export function logHistoricalSyncStart(logger: pino.Logger, provider: string): void {
  logger.info({ operation: 'historical_sync', event: 'historical_sync_start', provider }, 'Historical sync started');
}

export function logHistoricalSyncFinish(logger: pino.Logger, provider: string, sessionsSynced: number, eventsSynced: number): void {
  logger.info({ operation: 'historical_sync', event: 'historical_sync_finish', provider, sessionsSynced, eventsSynced }, 'Historical sync finished');
}

export function logIncrementalSyncStart(logger: pino.Logger): void {
  logger.info({ operation: 'incremental_sync', event: 'incremental_sync_start' }, 'Incremental sync started');
}

export function logIncrementalSyncFinish(logger: pino.Logger, sourcesSynced: number, eventsSynced: number): void {
  logger.info({ operation: 'incremental_sync', event: 'incremental_sync_finish', sourcesSynced, eventsSynced }, 'Incremental sync finished');
}

export function logSessionDeduplicated(logger: pino.Logger, sessionId: string): void {
  logger.debug({ operation: 'session_deduplicated', event: 'session_deduplicated', sessionId }, 'Session deduplicated');
}

export function logEventDeduplicated(logger: pino.Logger, deduplicationKey: string): void {
  logger.debug({ operation: 'event_deduplicated', event: 'event_deduplicated', deduplicationKey }, 'Event deduplicated');
}

export function logSyncStateUpdated(logger: pino.Logger, sourceIdentifier: string, hash: string): void {
  logger.debug({ operation: 'sync_state_updated', event: 'sync_state_updated', sourceIdentifier, hash }, 'Sync state updated');
}

export function logDatabaseInsertSuccess(logger: pino.Logger, table: string, count: number): void {
  logger.debug({ operation: 'db_insert', event: 'db_insert_success', table, count }, 'Database insert successful');
}

export function logDatabaseInsertFailure(logger: pino.Logger, table: string, error: Error): void {
  logger.error({ operation: 'db_insert', event: 'db_insert_failure', table, error: error.message }, 'Database insert failed');
}