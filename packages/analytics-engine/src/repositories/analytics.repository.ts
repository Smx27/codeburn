import pg from 'pg';

export interface AnalyticsPool {
  query: (text: string, params?: unknown[]) => Promise<pg.QueryResult>;
}

export function createAnalyticsRepository(pool: AnalyticsPool) {
  return {
    pool,

    async startAggregationRun(organizationId: string, aggregationType: string): Promise<string> {
      const result = await pool.query(
        `INSERT INTO aggregation_runs (organization_id, aggregation_type, started_at, status)
         VALUES ($1, $2, NOW(), 'running')
         RETURNING id`,
        [organizationId, aggregationType]
      );
      return result.rows[0].id;
    },

    async completeAggregationRun(id: string, recordsProcessed: number): Promise<void> {
      await pool.query(
        `UPDATE aggregation_runs
         SET status = 'completed', completed_at = NOW(), records_processed = $2
         WHERE id = $1`,
        [id, recordsProcessed]
      );
    },

    async failAggregationRun(id: string, errorMessage: string): Promise<void> {
      await pool.query(
        `UPDATE aggregation_runs
         SET status = 'failed', completed_at = NOW(), error_message = $2
         WHERE id = $1`,
        [id, errorMessage]
      );
    },

    async getEventDateRange(organizationId: string): Promise<{ minDate: Date | null; maxDate: Date | null } | null> {
      const result = await pool.query(
        `SELECT MIN(DATE(event_time)) as min_date, MAX(DATE(event_time)) as max_date
         FROM events WHERE organization_id = $1`,
        [organizationId]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        minDate: row.min_date ? new Date(row.min_date) : null,
        maxDate: row.max_date ? new Date(row.max_date) : null,
      };
    },

    async upsertDailyUsage(orgId: string, date: string, data: {
      totalSessions: number;
      totalUsers: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalTokens: number;
      totalCost: number;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO daily_usage (organization_id, usage_date, total_sessions, total_users, total_input_tokens, total_output_tokens, total_tokens, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (organization_id, usage_date)
         DO UPDATE SET
           total_sessions = EXCLUDED.total_sessions,
           total_users = EXCLUDED.total_users,
           total_input_tokens = EXCLUDED.total_input_tokens,
           total_output_tokens = EXCLUDED.total_output_tokens,
           total_tokens = EXCLUDED.total_tokens,
           total_cost = EXCLUDED.total_cost`,
        [orgId, date, data.totalSessions, data.totalUsers, data.totalInputTokens, data.totalOutputTokens, data.totalTokens, data.totalCost]
      );
    },

    async upsertDailyProviderUsage(orgId: string, date: string, data: {
      providerId: number;
      totalSessions: number;
      totalTokens: number;
      totalCost: number;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO daily_provider_usage (organization_id, provider_id, usage_date, total_sessions, total_tokens, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, provider_id, usage_date)
         DO UPDATE SET
           total_sessions = EXCLUDED.total_sessions,
           total_tokens = EXCLUDED.total_tokens,
           total_cost = EXCLUDED.total_cost`,
        [orgId, data.providerId, date, data.totalSessions, data.totalTokens, data.totalCost]
      );
    },

    async upsertDailyModelUsage(orgId: string, date: string, data: {
      model: string;
      totalTokens: number;
      totalCost: number;
      sessionCount: number;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO daily_model_usage (organization_id, model, usage_date, total_tokens, total_cost, session_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, model, usage_date)
         DO UPDATE SET
           total_tokens = EXCLUDED.total_tokens,
           total_cost = EXCLUDED.total_cost,
           session_count = EXCLUDED.session_count`,
        [orgId, data.model, date, data.totalTokens, data.totalCost, data.sessionCount]
      );
    },

    async upsertDailyUserUsage(orgId: string, date: string, data: {
      userId: string;
      sessionCount: number;
      tokenCount: number;
      cost: number;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO daily_user_usage (organization_id, user_id, usage_date, session_count, token_count, cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, user_id, usage_date)
         DO UPDATE SET
           session_count = EXCLUDED.session_count,
           token_count = EXCLUDED.token_count,
           cost = EXCLUDED.cost`,
        [orgId, data.userId, date, data.sessionCount, data.tokenCount, data.cost]
      );
    },

    async upsertDailyProjectUsage(orgId: string, date: string, data: {
      projectName: string;
      sessionCount: number;
      tokenCount: number;
      cost: number;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO daily_project_usage (organization_id, project_name, usage_date, session_count, token_count, cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, project_name, usage_date)
         DO UPDATE SET
           session_count = EXCLUDED.session_count,
           token_count = EXCLUDED.token_count,
           cost = EXCLUDED.cost`,
        [orgId, data.projectName, date, data.sessionCount, data.tokenCount, data.cost]
      );
    },

    async getRawEventAggregates(orgId: string, date: string): Promise<{
      totalSessions: number;
      totalUsers: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalTokens: number;
      totalCost: number;
    }> {
      const result = await pool.query(
        `SELECT
           COUNT(DISTINCT e.session_id) as total_sessions,
           COUNT(DISTINCT s.user_id) as total_users,
           COALESCE(SUM(e.input_tokens), 0) as total_input_tokens,
           COALESCE(SUM(e.output_tokens), 0) as total_output_tokens,
           COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as total_tokens,
           COALESCE(SUM(e.estimated_cost), 0) as total_cost
         FROM events e
         LEFT JOIN sessions s ON e.session_id = s.id
         WHERE e.organization_id = $1 AND DATE(e.event_time) = $2`,
        [orgId, date]
      );
      const row = result.rows[0];
      return {
        totalSessions: parseInt(row.total_sessions, 10),
        totalUsers: parseInt(row.total_users, 10),
        totalInputTokens: parseInt(row.total_input_tokens, 10),
        totalOutputTokens: parseInt(row.total_output_tokens, 10),
        totalTokens: parseInt(row.total_tokens, 10),
        totalCost: parseFloat(row.total_cost),
      };
    },

    async getProviderEventAggregates(orgId: string, date: string): Promise<{
      providerId: number;
      totalSessions: number;
      totalTokens: number;
      totalCost: number;
    }[]> {
      const result = await pool.query(
        `SELECT
           s.provider_id,
           COUNT(DISTINCT e.session_id) as total_sessions,
           COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as total_tokens,
           COALESCE(SUM(e.estimated_cost), 0) as total_cost
         FROM events e
         LEFT JOIN sessions s ON e.session_id = s.id
         WHERE e.organization_id = $1 AND DATE(e.event_time) = $2
         GROUP BY s.provider_id`,
        [orgId, date]
      );
      return result.rows.map((row: Record<string, string>) => ({
        providerId: parseInt(row.provider_id, 10),
        totalSessions: parseInt(row.total_sessions, 10),
        totalTokens: parseInt(row.total_tokens, 10),
        totalCost: parseFloat(row.total_cost),
      }));
    },

    async getModelEventAggregates(orgId: string, date: string): Promise<{
      model: string;
      totalTokens: number;
      totalCost: number;
      sessionCount: number;
    }[]> {
      const result = await pool.query(
        `SELECT
           model,
           COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
           COALESCE(SUM(estimated_cost), 0) as total_cost,
           COUNT(DISTINCT session_id) as session_count
         FROM events
         WHERE organization_id = $1 AND DATE(event_time) = $2
         GROUP BY model`,
        [orgId, date]
      );
      return result.rows.map((row: Record<string, string>) => ({
        model: row.model,
        totalTokens: parseInt(row.total_tokens, 10),
        totalCost: parseFloat(row.total_cost),
        sessionCount: parseInt(row.session_count, 10),
      }));
    },

    async getUserEventAggregates(orgId: string, date: string): Promise<{
      userId: string;
      sessionCount: number;
      tokenCount: number;
      cost: number;
    }[]> {
      const result = await pool.query(
        `SELECT
           s.user_id,
           COUNT(DISTINCT e.session_id) as session_count,
           COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as token_count,
           COALESCE(SUM(e.estimated_cost), 0) as cost
         FROM events e
         LEFT JOIN sessions s ON e.session_id = s.id
         WHERE e.organization_id = $1 AND DATE(e.event_time) = $2
         GROUP BY s.user_id`,
        [orgId, date]
      );
      return result.rows.map((row: Record<string, string>) => ({
        userId: row.user_id,
        sessionCount: parseInt(row.session_count, 10),
        tokenCount: parseInt(row.token_count, 10),
        cost: parseFloat(row.cost),
      }));
    },

    async getProjectEventAggregates(orgId: string, date: string): Promise<{
      projectName: string;
      sessionCount: number;
      tokenCount: number;
      cost: number;
    }[]> {
      const result = await pool.query(
        `SELECT
           COALESCE(s.project_name, 'unknown') as project_name,
           COUNT(DISTINCT e.session_id) as session_count,
           COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as token_count,
           COALESCE(SUM(e.estimated_cost), 0) as cost
         FROM events e
         LEFT JOIN sessions s ON e.session_id = s.id
         WHERE e.organization_id = $1 AND DATE(e.event_time) = $2
         GROUP BY COALESCE(s.project_name, 'unknown')`,
        [orgId, date]
      );
      return result.rows.map((row: Record<string, string>) => ({
        projectName: row.project_name,
        sessionCount: parseInt(row.session_count, 10),
        tokenCount: parseInt(row.token_count, 10),
        cost: parseFloat(row.cost),
      }));
    },

    async getOrganizationsForBackfill(): Promise<{ id: string }[]> {
      const result = await pool.query(
        `SELECT DISTINCT organization_id as id FROM events`
      );
      return result.rows;
    },

    async getUnaggregatedDates(orgId: string): Promise<string[]> {
      const result = await pool.query(
        `SELECT DISTINCT DATE(event_time) as event_date
         FROM events
         WHERE organization_id = $1
         AND DATE(event_time) NOT IN (
           SELECT usage_date FROM daily_usage WHERE organization_id = $1
         )
         ORDER BY event_date ASC`,
        [orgId]
      );
      return result.rows.map((row: Record<string, string>) => row.event_date);
    },
  };
}

export type AnalyticsRepository = ReturnType<typeof createAnalyticsRepository>;