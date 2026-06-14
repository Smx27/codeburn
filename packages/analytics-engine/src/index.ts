export { createAnalyticsService, type AnalyticsService, type AnalyticsServiceConfig } from './services/analytics.service.js';
export { createAnalyticsRepository, type AnalyticsRepository, type AnalyticsPool } from './repositories/analytics.repository.js';
export { runDailyAggregation, runDailyAggregationJob, type DailyAggregationResult } from './jobs/dailyAggregation.job.js';
export { runHistoricalBackfill, type BackfillResult } from './jobs/historicalBackfill.job.js';
export { aggregateDailyUsage } from './aggregators/dailyUsageAggregator.js';
export { aggregateProviderUsage } from './aggregators/providerUsageAggregator.js';
export { aggregateModelUsage } from './aggregators/modelUsageAggregator.js';
export { aggregateUserUsage } from './aggregators/userUsageAggregator.js';
export { aggregateProjectUsage } from './aggregators/projectUsageAggregator.js';
export type {
  AggregationRun,
  DailyUsage,
  DailyProviderUsage,
  DailyModelUsage,
  DailyUserUsage,
  DailyProjectUsage,
  AggregationJobInput,
  DailyAggregationInput,
  BackfillProgress,
  DashboardOverview,
  ProviderAnalytics,
  ModelAnalytics,
  UserAnalytics,
  ProjectAnalytics,
  TrendPoint,
  TrendsResponse,
  AggregationType,
  AggregationStatus,
} from './types/analytics.types.js';
export {
  analyticsLogger,
  createAggregationLogger,
  createDashboardLogger,
  logAggregationStart,
  logAggregationComplete,
  logAggregationFailed,
  logBackfillProgress,
  logDashboardRequest,
  logDashboardResponse,
  logAuthEvent,
} from './logging/analytics.logger.js';