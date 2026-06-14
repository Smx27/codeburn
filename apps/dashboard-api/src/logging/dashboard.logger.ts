import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const dashboardLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    service: 'aiinsight-dashboard-api',
  },
});

export function createRequestLogger(context: {
  requestId: string;
  organizationId: string;
  endpoint: string;
  userId?: string;
}) {
  return dashboardLogger.child({
    requestId: context.requestId,
    organizationId: context.organizationId,
    endpoint: context.endpoint,
    userId: context.userId,
  });
}