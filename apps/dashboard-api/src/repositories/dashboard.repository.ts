import { query, queryOne } from '../database/pool.js';

export interface DashboardOverview {
  totalSessions: number;
  totalUsers: number;
  totalTokens: number;
  totalCost: number;
  activeProviders: number;
  periodStart: string;
  periodEnd: string;
}

export interface ProviderAnalytics {
  providerId: number;
  providerName: string;
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  percentageOfTotal: number;
}

export interface ModelAnalytics {
  model: string;
  totalTokens: number;
  totalCost: number;
  sessionCount: number;
  percentageOfTotal: number;
}

export interface UserAnalytics {
  userId: string;
  userEmail: string;
  userName: string | null;
  sessionCount: number;
  tokenCount: number;
  cost: number;
}

export interface ProjectAnalytics {
  projectName: string;
  sessionCount: number;
  tokenCount: number;
  cost: number;
}

export interface TrendPoint {
  date: string;
  sessions: number;
  users: number;
  tokens: number;
  cost: number;
}

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case '24h':
      start.setDate(start.getDate() - 1);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function getOverview(orgId: string, period: string): Promise<DashboardOverview> {
  const { start, end } = getDateRange(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const result = await queryOne<{
    total_sessions: string;
    total_users: string;
    total_tokens: string;
    total_cost: string;
    active_providers: string;
  }>(
    `SELECT
       COALESCE(SUM(total_sessions), 0) as total_sessions,
       COALESCE(MAX(total_users), 0) as total_users,
       COALESCE(SUM(total_tokens), 0) as total_tokens,
       COALESCE(SUM(total_cost), 0) as total_cost,
       (SELECT COUNT(DISTINCT provider_id) FROM daily_provider_usage
        WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3) as active_providers
     FROM daily_usage
     WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3`,
    [orgId, startStr, endStr]
  );

  return {
    totalSessions: parseInt(result?.total_sessions ?? '0', 10),
    totalUsers: parseInt(result?.total_users ?? '0', 10),
    totalTokens: parseInt(result?.total_tokens ?? '0', 10),
    totalCost: parseFloat(result?.total_cost ?? '0'),
    activeProviders: parseInt(result?.active_providers ?? '0', 10),
    periodStart: startStr,
    periodEnd: endStr,
  };
}

export async function getProviderAnalytics(orgId: string, period: string): Promise<ProviderAnalytics[]> {
  const { start, end } = getDateRange(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const totalCostResult = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(total_cost), 0) as total
     FROM daily_provider_usage
     WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3`,
    [orgId, startStr, endStr]
  );
  const totalCost = parseFloat(totalCostResult?.total ?? '0');

  const rows = await query<{
    provider_id: number;
    provider_name: string;
    total_sessions: string;
    total_tokens: string;
    total_cost: string;
  }>(
    `SELECT
       dpu.provider_id,
       p.name as provider_name,
       COALESCE(SUM(dpu.total_sessions), 0) as total_sessions,
       COALESCE(SUM(dpu.total_tokens), 0) as total_tokens,
       COALESCE(SUM(dpu.total_cost), 0) as total_cost
     FROM daily_provider_usage dpu
     JOIN providers p ON dpu.provider_id = p.id
     WHERE dpu.organization_id = $1 AND dpu.usage_date >= $2 AND dpu.usage_date <= $3
     GROUP BY dpu.provider_id, p.name
     ORDER BY total_cost DESC`,
    [orgId, startStr, endStr]
  );

  return rows.map((row) => ({
    providerId: row.provider_id,
    providerName: row.provider_name,
    totalSessions: parseInt(row.total_sessions, 10),
    totalTokens: parseInt(row.total_tokens, 10),
    totalCost: parseFloat(row.total_cost),
    percentageOfTotal: totalCost > 0 ? (parseFloat(row.total_cost) / totalCost) * 100 : 0,
  }));
}

export async function getModelAnalytics(orgId: string, period: string, limit: number = 20): Promise<ModelAnalytics[]> {
  const { start, end } = getDateRange(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const totalCostResult = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(total_cost), 0) as total
     FROM daily_model_usage
     WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3`,
    [orgId, startStr, endStr]
  );
  const totalCost = parseFloat(totalCostResult?.total ?? '0');

  const rows = await query<{
    model: string;
    total_tokens: string;
    total_cost: string;
    session_count: string;
  }>(
    `SELECT
       model,
       COALESCE(SUM(total_tokens), 0) as total_tokens,
       COALESCE(SUM(total_cost), 0) as total_cost,
       COALESCE(SUM(session_count), 0) as session_count
     FROM daily_model_usage
     WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3
     GROUP BY model
     ORDER BY total_cost DESC
     LIMIT $4`,
    [orgId, startStr, endStr, limit]
  );

  return rows.map((row) => ({
    model: row.model,
    totalTokens: parseInt(row.total_tokens, 10),
    totalCost: parseFloat(row.total_cost),
    sessionCount: parseInt(row.session_count, 10),
    percentageOfTotal: totalCost > 0 ? (parseFloat(row.total_cost) / totalCost) * 100 : 0,
  }));
}

export async function getUserAnalytics(orgId: string, period: string, limit: number = 20): Promise<UserAnalytics[]> {
  const { start, end } = getDateRange(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const rows = await query<{
    user_id: string;
    user_email: string;
    user_name: string | null;
    session_count: string;
    token_count: string;
    cost: string;
  }>(
    `SELECT
       du.user_id,
       u.email as user_email,
       u.name as user_name,
       COALESCE(SUM(du.session_count), 0) as session_count,
       COALESCE(SUM(du.token_count), 0) as token_count,
       COALESCE(SUM(du.cost), 0) as cost
     FROM daily_user_usage du
     JOIN users u ON du.user_id = u.id
     WHERE du.organization_id = $1 AND du.usage_date >= $2 AND du.usage_date <= $3
     GROUP BY du.user_id, u.email, u.name
     ORDER BY cost DESC
     LIMIT $4`,
    [orgId, startStr, endStr, limit]
  );

  return rows.map((row) => ({
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    sessionCount: parseInt(row.session_count, 10),
    tokenCount: parseInt(row.token_count, 10),
    cost: parseFloat(row.cost),
  }));
}

export async function getProjectAnalytics(orgId: string, period: string, limit: number = 20): Promise<ProjectAnalytics[]> {
  const { start, end } = getDateRange(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const rows = await query<{
    project_name: string;
    session_count: string;
    token_count: string;
    cost: string;
  }>(
    `SELECT
       project_name,
       COALESCE(SUM(session_count), 0) as session_count,
       COALESCE(SUM(token_count), 0) as token_count,
       COALESCE(SUM(cost), 0) as cost
     FROM daily_project_usage
     WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3
     GROUP BY project_name
     ORDER BY cost DESC
     LIMIT $4`,
    [orgId, startStr, endStr, limit]
  );

  return rows.map((row) => ({
    projectName: row.project_name,
    sessionCount: parseInt(row.session_count, 10),
    tokenCount: parseInt(row.token_count, 10),
    cost: parseFloat(row.cost),
  }));
}

export async function getTrends(
  orgId: string,
  period: string,
  granularity: 'daily' | 'weekly' | 'monthly'
): Promise<TrendPoint[]> {
  const { start, end } = getDateRange(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  let dateFormat: string;
  let groupBy: string;
  switch (granularity) {
    case 'weekly':
      dateFormat = "DATE_TRUNC('week', usage_date)";
      groupBy = "DATE_TRUNC('week', usage_date)";
      break;
    case 'monthly':
      dateFormat = "DATE_TRUNC('month', usage_date)";
      groupBy = "DATE_TRUNC('month', usage_date)";
      break;
    default:
      dateFormat = 'usage_date';
      groupBy = 'usage_date';
  }

  const rows = await query<{
    date: string;
    sessions: string;
    users: string;
    tokens: string;
    cost: string;
  }>(
    `SELECT
       ${dateFormat} as date,
       COALESCE(SUM(total_sessions), 0) as sessions,
       COALESCE(MAX(total_users), 0) as users,
       COALESCE(SUM(total_tokens), 0) as tokens,
       COALESCE(SUM(total_cost), 0) as cost
     FROM daily_usage
     WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3
     GROUP BY ${groupBy}
     ORDER BY date ASC`,
    [orgId, startStr, endStr]
  );

  return rows.map((row) => ({
    date: row.date,
    sessions: parseInt(row.sessions, 10),
    users: parseInt(row.users, 10),
    tokens: parseInt(row.tokens, 10),
    cost: parseFloat(row.cost),
  }));
}

export async function getUserById(userId: string): Promise<{ id: string; email: string; name: string | null; organization_id: string; role: string } | null> {
  return queryOne<{ id: string; email: string; name: string | null; organization_id: string; role: string }>(
    `SELECT id, email, name, organization_id, role FROM users WHERE id = $1`,
    [userId]
  );
}

export async function getApiKeyByPrefix(prefix: string): Promise<{ id: string; organization_id: string; key_hash: string; role: string } | null> {
  return queryOne<{ id: string; organization_id: string; key_hash: string; role: string }>(
    `SELECT id, organization_id, key_hash, role FROM api_keys WHERE prefix = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
    [prefix]
  );
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);
}

export async function getUserByEmail(email: string): Promise<{ id: string; email: string; name: string | null; organization_id: string; role: string; password_hash: string } | null> {
  return queryOne<{ id: string; email: string; name: string | null; organization_id: string; role: string; password_hash: string }>(
    `SELECT id, email, name, organization_id, role, password_hash FROM users WHERE email = $1`,
    [email]
  );
}

export async function createUser(email: string, passwordHash: string, name: string | null, organizationId: string, role: string = 'owner'): Promise<{ id: string; email: string; name: string | null; organization_id: string; role: string }> {
  return (await queryOne<{ id: string; email: string; name: string | null; organization_id: string; role: string }>(
    `INSERT INTO users (email, password_hash, name, organization_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, organization_id, role`,
    [email, passwordHash, name, organizationId, role]
  ))!;
}

export async function createOrganization(name: string): Promise<{ id: string; name: string; created_at: string }> {
  return (await queryOne<{ id: string; name: string; created_at: string }>(
    `INSERT INTO organizations (name) VALUES ($1) RETURNING id, name, created_at`,
    [name]
  ))!;
}

export async function createOrganizationSettings(organizationId: string): Promise<void> {
  await query(
    `INSERT INTO organization_settings (organization_id) VALUES ($1)`,
    [organizationId]
  );
}

export async function createTeam(organizationId: string, name: string, description: string | null = null): Promise<{ id: string; name: string }> {
  return (await queryOne<{ id: string; name: string }>(
    `INSERT INTO teams (organization_id, name, description) VALUES ($1, $2, $3) RETURNING id, name`,
    [organizationId, name, description]
  ))!;
}

export async function createTeamMember(teamId: string, userId: string, role: string = 'admin'): Promise<void> {
  await query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)`,
    [teamId, userId, role]
  );
}

export async function getRefreshTokenByHash(tokenHash: string): Promise<{ id: string; user_id: string; expires_at: string } | null> {
  return queryOne<{ id: string; user_id: string; expires_at: string }>(
    `SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
}

export async function createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function deleteRefreshTokensForUser(userId: string): Promise<void> {
  await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
}

export async function deleteRefreshToken(tokenHash: string): Promise<void> {
  await query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
}

export async function getUserWithPasswordByEmail(email: string): Promise<{ id: string; email: string; name: string | null; organization_id: string; role: string; password_hash: string } | null> {
  return queryOne<{ id: string; email: string; name: string | null; organization_id: string; role: string; password_hash: string }>(
    `SELECT id, email, name, organization_id, role, password_hash FROM users WHERE email = $1 AND password_hash IS NOT NULL`,
    [email]
  );
}

export async function getOrganizationById(orgId: string): Promise<{ id: string; name: string; created_at: string } | null> {
  return queryOne<{ id: string; name: string; created_at: string }>(
    `SELECT id, name, created_at FROM organizations WHERE id = $1`,
    [orgId]
  );
}

export async function getOrganizationSettings(orgId: string): Promise<{ timezone: string; currency: string; retention_days: number } | null> {
  return queryOne<{ timezone: string; currency: string; retention_days: number }>(
    `SELECT timezone, currency, retention_days FROM organization_settings WHERE organization_id = $1`,
    [orgId]
  );
}

export async function updateOrganization(orgId: string, name: string): Promise<void> {
  await query(`UPDATE organizations SET name = $1 WHERE id = $2`, [name, orgId]);
}

export async function updateOrganizationSettings(orgId: string, settings: { timezone?: string; currency?: string; retention_days?: number }): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (settings.timezone !== undefined) {
    fields.push(`timezone = $${paramIndex++}`);
    values.push(settings.timezone);
  }
  if (settings.currency !== undefined) {
    fields.push(`currency = $${paramIndex++}`);
    values.push(settings.currency);
  }
  if (settings.retention_days !== undefined) {
    fields.push(`retention_days = $${paramIndex++}`);
    values.push(settings.retention_days);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = NOW()`);
  values.push(orgId);

  await query(
    `UPDATE organization_settings SET ${fields.join(', ')} WHERE organization_id = $${paramIndex}`,
    values
  );
}

export async function getOrganizationCounts(orgId: string): Promise<{ users: number; teams: number; machines: number; providers: number; sessions: number; events: number }> {
  const result = await queryOne<{ users: string; teams: string; machines: string; providers: string; sessions: string; events: string }>(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE organization_id = $1) as users,
       (SELECT COUNT(*) FROM teams WHERE organization_id = $1) as teams,
       (SELECT COUNT(*) FROM machines WHERE organization_id = $1) as machines,
       (SELECT COUNT(DISTINCT provider_id) FROM sessions WHERE organization_id = $1) as providers,
       (SELECT COUNT(*) FROM sessions WHERE organization_id = $1) as sessions,
       (SELECT COUNT(*) FROM events WHERE organization_id = $1) as events`,
    [orgId]
  );

  return {
    users: parseInt(result?.users ?? '0', 10),
    teams: parseInt(result?.teams ?? '0', 10),
    machines: parseInt(result?.machines ?? '0', 10),
    providers: parseInt(result?.providers ?? '0', 10),
    sessions: parseInt(result?.sessions ?? '0', 10),
    events: parseInt(result?.events ?? '0', 10),
  };
}