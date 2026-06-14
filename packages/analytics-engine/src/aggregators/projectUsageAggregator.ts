import type { AnalyticsRepository } from '../repositories/analytics.repository.js';

export async function aggregateProjectUsage(
  repo: AnalyticsRepository,
  orgId: string,
  date: string
): Promise<void> {
  const rows = await repo.getProjectEventAggregates(orgId, date);

  for (const row of rows) {
    await repo.upsertDailyProjectUsage(orgId, date, {
      projectName: row.projectName,
      sessionCount: row.sessionCount,
      tokenCount: row.tokenCount,
      cost: row.cost,
    });
  }
}
