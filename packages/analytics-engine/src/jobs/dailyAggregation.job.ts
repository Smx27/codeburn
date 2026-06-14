import type { AnalyticsRepository } from '../repositories/analytics.repository.js';
import { aggregateDailyUsage } from '../aggregators/dailyUsageAggregator.js';
import { aggregateProviderUsage } from '../aggregators/providerUsageAggregator.js';
import { aggregateModelUsage } from '../aggregators/modelUsageAggregator.js';
import { aggregateUserUsage } from '../aggregators/userUsageAggregator.js';
import { aggregateProjectUsage } from '../aggregators/projectUsageAggregator.js';
import { createAggregationLogger, logAggregationStart, logAggregationComplete, logAggregationFailed } from '../logging/analytics.logger.js';

export interface DailyAggregationResult {
  organizationId: string;
  date: string;
  success: boolean;
  error?: string;
}

export async function runDailyAggregation(
  repo: AnalyticsRepository,
  organizationId: string,
  date: Date
): Promise<DailyAggregationResult> {
  const operationId = crypto.randomUUID();
  const dateStr = date.toISOString().split('T')[0];
  const logger = createAggregationLogger({
    operationId,
    organizationId,
    aggregationType: 'daily',
  });

  const startTime = Date.now();

  try {
    logAggregationStart(logger, 'daily', { start: date, end: date });

    await repo.upsertDailyUsage(organizationId, dateStr, {
      totalSessions: 0,
      totalUsers: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
    });

    await aggregateDailyUsage(repo, organizationId, dateStr);
    await aggregateProviderUsage(repo, organizationId, dateStr);
    await aggregateModelUsage(repo, organizationId, dateStr);
    await aggregateUserUsage(repo, organizationId, dateStr);
    await aggregateProjectUsage(repo, organizationId, dateStr);

    const durationMs = Date.now() - startTime;
    logAggregationComplete(logger, 'daily', 5, durationMs);

    return { organizationId, date: dateStr, success: true };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logAggregationFailed(logger, 'daily', error as Error, durationMs);
    return { organizationId, date: dateStr, success: false, error: (error as Error).message };
  }
}

export async function runDailyAggregationJob(repo: AnalyticsRepository): Promise<DailyAggregationResult[]> {
  const results: DailyAggregationResult[] = [];
  const organizations = await repo.getOrganizationsForBackfill();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const org of organizations) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const result = await runDailyAggregation(repo, org.id, yesterday);
    results.push(result);
  }

  return results;
}
