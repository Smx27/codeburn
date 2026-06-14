import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const analyticsLogger = pino({
  level: process.env.ANALYTICS_LOG_LEVEL || 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    service: 'aiinsight-analytics-engine',
  },
});

export function createAggregationLogger(context: {
  operationId: string;
  organizationId: string;
  aggregationType: string;
}) {
  return analyticsLogger.child({
    operationId: context.operationId,
    organizationId: context.organizationId,
    aggregationType: context.aggregationType,
  });
}

export function createDashboardLogger(context: {
  requestId: string;
  organizationId: string;
  endpoint: string;
}) {
  return analyticsLogger.child({
    requestId: context.requestId,
    organizationId: context.organizationId,
    endpoint: context.endpoint,
  });
}

export function logAggregationStart(logger: pino.Logger, aggregationType: string, dateRange: { start: Date; end: Date }) {
  logger.info(
    { aggregationType, startDate: dateRange.start.toISOString(), endDate: dateRange.end.toISOString() },
    'Aggregation started'
  );
}

export function logAggregationComplete(
  logger: pino.Logger,
  aggregationType: string,
  recordsProcessed: number,
  durationMs: number
) {
  logger.info(
    { aggregationType, recordsProcessed, durationMs },
    'Aggregation completed'
  );
}

export function logAggregationFailed(logger: pino.Logger, aggregationType: string, error: Error, durationMs: number) {
  logger.error(
    { aggregationType, error: error.message, stack: error.stack, durationMs },
    'Aggregation failed'
  );
}

export function logBackfillProgress(
  logger: pino.Logger,
  progress: {
    organizationId: string;
    totalDays: number;
    processedDays: number;
    currentDate: Date | null;
  }
) {
  logger.info(
    { ...progress, progressPercent: progress.totalDays > 0 ? Math.round((progress.processedDays / progress.totalDays) * 100) : 0 },
    'Backfill progress'
  );
}

export function logDashboardRequest(logger: pino.Logger, method: string, path: string) {
  logger.debug({ method, path }, 'Dashboard request received');
}

export function logDashboardResponse(logger: pino.Logger, method: string, path: string, statusCode: number, durationMs: number) {
  logger.info({ method, path, statusCode, durationMs }, 'Dashboard request completed');
}

export function logAuthEvent(logger: pino.Logger, event: 'login' | 'logout' | 'token_refresh' | 'auth_failure', details: Record<string, unknown>) {
  logger.info({ authEvent: event, ...details }, `Auth: ${event}`);
}