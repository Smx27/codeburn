import pg from 'pg';
import { createAnalyticsRepository, type AnalyticsRepository } from '../repositories/analytics.repository.js';
import { runDailyAggregation, runDailyAggregationJob, type DailyAggregationResult } from '../jobs/dailyAggregation.job.js';
import { runHistoricalBackfill, type BackfillResult } from '../jobs/historicalBackfill.job.js';

export interface AnalyticsServiceConfig {
  databaseUrl: string;
}

export function createAnalyticsService(config: AnalyticsServiceConfig) {
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  const repo = createAnalyticsRepository(pool);

  return {
    pool,
    repo,

    async runDailyAggregation(organizationId: string, date: Date): Promise<DailyAggregationResult> {
      return runDailyAggregation(repo, organizationId, date);
    },

    async runDailyAggregationJob(): Promise<DailyAggregationResult[]> {
      return runDailyAggregationJob(repo);
    },

    async runHistoricalBackfill(organizationId: string): Promise<BackfillResult> {
      return runHistoricalBackfill(repo, organizationId);
    },

    async runBackfillForAllOrganizations(): Promise<BackfillResult[]> {
      const organizations = await repo.getOrganizationsForBackfill();
      const results: BackfillResult[] = [];
      for (const org of organizations) {
        const result = await runHistoricalBackfill(repo, org.id);
        results.push(result);
      }
      return results;
    },

    async shutdown(): Promise<void> {
      await pool.end();
    },
  };
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;