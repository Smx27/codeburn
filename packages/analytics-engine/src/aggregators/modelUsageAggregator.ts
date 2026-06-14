import type { AnalyticsRepository } from '../repositories/analytics.repository.js';

export async function aggregateModelUsage(
  repo: AnalyticsRepository,
  orgId: string,
  date: string
): Promise<void> {
  const rows = await repo.getModelEventAggregates(orgId, date);

  for (const row of rows) {
    await repo.upsertDailyModelUsage(orgId, date, {
      model: row.model,
      totalTokens: row.totalTokens,
      totalCost: row.totalCost,
      sessionCount: row.sessionCount,
    });
  }
}
