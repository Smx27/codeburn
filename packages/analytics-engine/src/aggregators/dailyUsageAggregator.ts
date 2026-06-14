import type { AnalyticsRepository } from '../repositories/analytics.repository.js';

export async function aggregateDailyUsage(
  repo: AnalyticsRepository,
  orgId: string,
  date: string
): Promise<void> {
  const data = await repo.getRawEventAggregates(orgId, date);
  await repo.upsertDailyUsage(orgId, date, data);
}
