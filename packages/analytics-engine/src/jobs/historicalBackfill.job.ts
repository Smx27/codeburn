import type { AnalyticsRepository } from '../repositories/analytics.repository.js';
import { aggregateDailyUsage } from '../aggregators/dailyUsageAggregator.js';
import { aggregateProviderUsage } from '../aggregators/providerUsageAggregator.js';
import { aggregateModelUsage } from '../aggregators/modelUsageAggregator.js';
import { aggregateUserUsage } from '../aggregators/userUsageAggregator.js';
import { aggregateProjectUsage } from '../aggregators/projectUsageAggregator.js';
import { createAggregationLogger, logAggregationStart, logAggregationComplete, logAggregationFailed, logBackfillProgress } from '../logging/analytics.logger.js';

export interface BackfillResult {
  organizationId: string;
  totalDays: number;
  processedDays: number;
  failedDays: number;
  errors: string[];
  durationMs: number;
}

export async function runHistoricalBackfill(
  repo: AnalyticsRepository,
  organizationId: string
): Promise<BackfillResult> {
  const operationId = crypto.randomUUID();
  const logger = createAggregationLogger({
    operationId,
    organizationId,
    aggregationType: 'historical_backfill',
  });

  const startTime = Date.now();
  const errors: string[] = [];
  let processedDays = 0;
  let failedDays = 0;

  const runId = await repo.startAggregationRun(organizationId, 'historical_backfill');

  try {
    const dateRange = await repo.getEventDateRange(organizationId);
    if (!dateRange?.minDate || !dateRange?.maxDate) {
      await repo.completeAggregationRun(runId, 0);
      return { organizationId, totalDays: 0, processedDays: 0, failedDays: 0, errors: [], durationMs: Date.now() - startTime };
    }

    const startDate = new Date(dateRange.minDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.maxDate);
    endDate.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    logAggregationStart(logger, 'historical_backfill', { start: startDate, end: endDate });

    const unaggregatedDates = await repo.getUnaggregatedDates(organizationId);
    const datesToProcess = unaggregatedDates.length > 0 ? unaggregatedDates : generateDateRange(startDate, endDate);

    for (let i = 0; i < datesToProcess.length; i++) {
      const dateStr = datesToProcess[i];

      try {
        await aggregateDailyUsage(repo, organizationId, dateStr);
        await aggregateProviderUsage(repo, organizationId, dateStr);
        await aggregateModelUsage(repo, organizationId, dateStr);
        await aggregateUserUsage(repo, organizationId, dateStr);
        await aggregateProjectUsage(repo, organizationId, dateStr);
        processedDays++;
      } catch (error) {
        failedDays++;
        const errMsg = `Failed to aggregate ${dateStr}: ${(error as Error).message}`;
        errors.push(errMsg);
        logger.error({ date: dateStr, error: (error as Error).message }, errMsg);
      }

      if (i % 10 === 0 || i === datesToProcess.length - 1) {
        logBackfillProgress(logger, {
          organizationId,
          totalDays: datesToProcess.length,
          processedDays: i + 1,
          currentDate: new Date(dateStr),
        });
      }
    }

    await repo.completeAggregationRun(runId, processedDays);

    const durationMs = Date.now() - startTime;
    logAggregationComplete(logger, 'historical_backfill', processedDays, durationMs);

    return { organizationId, totalDays: datesToProcess.length, processedDays, failedDays, errors, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logAggregationFailed(logger, 'historical_backfill', error as Error, durationMs);
    await repo.failAggregationRun(runId, (error as Error).message);
    return { organizationId, totalDays: 0, processedDays, failedDays, errors: [(error as Error).message], durationMs };
  }
}

function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
