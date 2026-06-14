import type { AnalyticsRepository } from '../repositories/analytics.repository.js';

export async function aggregateProviderUsage(
  repo: AnalyticsRepository,
  orgId: string,
  date: string
): Promise<void> {
  const rows = await repo.getProviderEventAggregates(orgId, date);

  for (const row of rows) {
    await repo.upsertDailyProviderUsage(orgId, date, {
      providerId: row.providerId,
      totalSessions: row.totalSessions,
      totalTokens: row.totalTokens,
      totalCost: row.totalCost,
    });
  }
}
