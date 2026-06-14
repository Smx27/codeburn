import type { AnalyticsRepository } from '../repositories/analytics.repository.js';

export async function aggregateUserUsage(
  repo: AnalyticsRepository,
  orgId: string,
  date: string
): Promise<void> {
  const rows = await repo.getUserEventAggregates(orgId, date);

  for (const row of rows) {
    await repo.upsertDailyUserUsage(orgId, date, {
      userId: row.userId,
      sessionCount: row.sessionCount,
      tokenCount: row.tokenCount,
      cost: row.cost,
    });
  }
}
