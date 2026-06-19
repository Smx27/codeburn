import { query, queryOne } from '../database/pool.js';
import type { SessionListItem, SessionEvent, SessionListFilters } from '../types/session.types.js';

export async function getSessionsWithFilters(
  orgId: string,
  filters: SessionListFilters
): Promise<{ sessions: SessionListItem[]; total: number }> {
  const {
    page, limit, sortBy, sortDir,
    search, provider, model, userId, machineId,
    startDate, endDate,
  } = filters;

  const whereClauses: string[] = ['s.organization_id = $1'];
  const params: unknown[] = [orgId];
  let paramIndex = 2;

  if (search) {
    whereClauses.push(`(
      p.name ILIKE $${paramIndex} OR
      u.name ILIKE $${paramIndex} OR
      u.email ILIKE $${paramIndex} OR
      m.hostname ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (provider) {
    whereClauses.push(`p.name = $${paramIndex++}`);
    params.push(provider);
  }

  if (model) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM events e2 WHERE e2.session_id = s.id AND e2.model = $${paramIndex}
    )`);
    params.push(model);
    paramIndex++;
  }

  if (userId) {
    whereClauses.push(`s.user_id = $${paramIndex++}`);
    params.push(userId);
  }

  if (machineId) {
    whereClauses.push(`s.machine_id = $${paramIndex++}`);
    params.push(machineId);
  }

  if (startDate) {
    whereClauses.push(`s.started_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push(`s.started_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sortColumnMap: Record<string, string> = {
    started_at: 's.started_at',
    duration: 'COALESCE(s.ended_at, NOW()) - s.started_at',
    tokens: 'COALESCE(SUM(e.input_tokens), 0) + COALESCE(SUM(e.output_tokens), 0)',
    cost: 'COALESCE(SUM(e.estimated_cost), 0)',
  };
  const sortColumn = sortColumnMap[sortBy] ?? 's.started_at';
  const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM sessions s
     JOIN providers p ON s.provider_id = p.id
     JOIN users u ON s.user_id = u.id
     JOIN machines m ON s.machine_id = m.id
     ${whereSql}`,
    params
  );
  const total = parseInt(countResult?.count ?? '0', 10);

  const rows = await query<{
    id: string;
    provider: string;
    project_name: string | null;
    user_name: string | null;
    user_email: string;
    machine_name: string;
    started_at: string;
    ended_at: string | null;
    total_input_tokens: string;
    total_output_tokens: string;
    estimated_cost: string;
  }>(
    `SELECT
      s.id,
      p.name as provider,
      s.project_name,
      u.name as user_name,
      u.email as user_email,
      m.hostname as machine_name,
      s.started_at,
      s.ended_at,
      COALESCE(SUM(e.input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(e.output_tokens), 0) as total_output_tokens,
      COALESCE(SUM(e.estimated_cost), 0) as estimated_cost
    FROM sessions s
    JOIN providers p ON s.provider_id = p.id
    JOIN users u ON s.user_id = u.id
    JOIN machines m ON s.machine_id = m.id
    LEFT JOIN events e ON e.session_id = s.id
    ${whereSql}
    GROUP BY s.id, p.name, u.name, u.email, m.hostname
    ORDER BY ${sortColumn} ${orderDir}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, (page - 1) * limit]
  );

  const sessions: SessionListItem[] = rows.map((row) => {
    const inputTokens = parseInt(row.total_input_tokens, 10);
    const outputTokens = parseInt(row.total_output_tokens, 10);
    const startedAt = new Date(row.started_at);
    const endedAt = row.ended_at ? new Date(row.ended_at) : null;
    const durationSeconds = endedAt
      ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
      : 0;

    return {
      id: row.id,
      provider: row.provider,
      projectName: row.project_name,
      userName: row.user_name ?? row.user_email,
      userEmail: row.user_email,
      machineName: row.machine_name,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds,
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost: parseFloat(row.estimated_cost),
    };
  });

  return { sessions, total };
}

export async function getSessionById(
  orgId: string,
  sessionId: string
): Promise<{
  session: Omit<SessionListItem, 'totalInputTokens' | 'totalOutputTokens' | 'totalTokens' | 'estimatedCost'> & {
    userId: string; user_name: string | null; user_email: string;
    machineId: string; machine_name: string;
  };
  aggregates: { totalInputTokens: number; totalOutputTokens: number; estimatedCost: number; eventCount: number };
} | null> {
  const row = await queryOne<{
    id: string;
    provider: string;
    project_name: string | null;
    user_id: string;
    user_name: string | null;
    user_email: string;
    machine_id: string;
    machine_name: string;
    started_at: string;
    ended_at: string | null;
  }>(
    `SELECT
      s.id,
      p.name as provider,
      s.project_name,
      s.user_id,
      u.name as user_name,
      u.email as user_email,
      s.machine_id,
      m.hostname as machine_name,
      s.started_at,
      s.ended_at
    FROM sessions s
    JOIN providers p ON s.provider_id = p.id
    JOIN users u ON s.user_id = u.id
    JOIN machines m ON s.machine_id = m.id
    WHERE s.organization_id = $1 AND s.id = $2`,
    [orgId, sessionId]
  );

  if (!row) return null;

  const agg = await queryOne<{
    total_input_tokens: string;
    total_output_tokens: string;
    estimated_cost: string;
    event_count: string;
  }>(
    `SELECT
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens,
      COALESCE(SUM(estimated_cost), 0) as estimated_cost,
      COUNT(*) as event_count
    FROM events
    WHERE session_id = $1`,
    [sessionId]
  );

  const startedAt = new Date(row.started_at);
  const endedAt = row.ended_at ? new Date(row.ended_at) : null;
  const durationSeconds = endedAt
    ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
    : 0;

  return {
    session: {
      id: row.id,
      provider: row.provider,
      projectName: row.project_name,
      userName: row.user_name ?? row.user_email,
      userEmail: row.user_email,
      machineName: row.machine_name,
      userId: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      machineId: row.machine_id,
      machine_name: row.machine_name,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds,
    },
    aggregates: {
      totalInputTokens: parseInt(agg?.total_input_tokens ?? '0', 10),
      totalOutputTokens: parseInt(agg?.total_output_tokens ?? '0', 10),
      estimatedCost: parseFloat(agg?.estimated_cost ?? '0'),
      eventCount: parseInt(agg?.event_count ?? '0', 10),
    },
  };
}

export async function getSessionEvents(
  orgId: string,
  sessionId: string
): Promise<SessionEvent[]> {
  const rows = await query<{
    id: string;
    event_type: string;
    model: string;
    input_tokens: string;
    output_tokens: string;
    cache_read_tokens: string;
    cache_write_tokens: string;
    estimated_cost: string;
    event_time: string;
  }>(
    `SELECT
      e.id,
      e.event_type,
      e.model,
      e.input_tokens,
      e.output_tokens,
      e.cache_read_tokens,
      e.cache_write_tokens,
      e.estimated_cost,
      e.event_time
    FROM events e
    JOIN sessions s ON e.session_id = s.id
    WHERE s.organization_id = $1 AND e.session_id = $2
    ORDER BY e.event_time ASC`,
    [orgId, sessionId]
  );

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    model: row.model,
    inputTokens: parseInt(row.input_tokens, 10),
    outputTokens: parseInt(row.output_tokens, 10),
    cacheReadTokens: parseInt(row.cache_read_tokens, 10),
    cacheWriteTokens: parseInt(row.cache_write_tokens, 10),
    estimatedCost: parseFloat(row.estimated_cost),
    eventTime: row.event_time,
  }));
}
