import { query, queryOne } from '../database/pool.js';
import type { MachineDetail, MachineStats, MachineDailyActivity, MachineProviderBreakdown, MachineModelBreakdown, SessionListItem } from '../types/session.types.js';

export async function getMachineById(
  orgId: string,
  machineId: string
): Promise<MachineDetail | null> {
  const row = await queryOne<{
    id: string;
    hostname: string;
    os: string | null;
    architecture: string | null;
    agent_version: string | null;
    status: string;
    first_seen: string;
    last_seen: string;
    user_id: string;
    user_name: string | null;
    user_email: string;
  }>(
    `SELECT
      m.id,
      m.hostname,
      m.os,
      m.architecture,
      m.agent_version,
      m.status,
      m.first_seen,
      m.last_seen,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email
    FROM machines m
    JOIN users u ON m.user_id = u.id
    WHERE m.organization_id = $1 AND m.id = $2`,
    [orgId, machineId]
  );

  if (!row) return null;

  return {
    id: row.id,
    hostname: row.hostname,
    os: row.os,
    architecture: row.architecture,
    agentVersion: row.agent_version,
    status: row.status,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    user: { id: row.user_id, name: row.user_name, email: row.user_email },
  };
}

export async function getMachineStats(
  orgId: string,
  machineId: string
): Promise<MachineStats> {
  const row = await queryOne<{
    total_sessions: string;
    total_input_tokens: string;
    total_output_tokens: string;
    total_cost: string;
  }>(
    `SELECT
      COUNT(DISTINCT s.id) as total_sessions,
      COALESCE(SUM(e.input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(e.output_tokens), 0) as total_output_tokens,
      COALESCE(SUM(e.estimated_cost), 0) as total_cost
    FROM sessions s
    LEFT JOIN events e ON e.session_id = s.id
    WHERE s.organization_id = $1 AND s.machine_id = $2`,
    [orgId, machineId]
  );

  return {
    totalSessions: parseInt(row?.total_sessions ?? '0', 10),
    totalInputTokens: parseInt(row?.total_input_tokens ?? '0', 10),
    totalOutputTokens: parseInt(row?.total_output_tokens ?? '0', 10),
    totalTokens: parseInt(row?.total_input_tokens ?? '0', 10) + parseInt(row?.total_output_tokens ?? '0', 10),
    totalCost: parseFloat(row?.total_cost ?? '0'),
  };
}

export async function getMachineDailyActivity(
  orgId: string,
  machineId: string,
  days: number = 30
): Promise<MachineDailyActivity[]> {
  const rows = await query<{
    date: string;
    sessions: string;
    tokens: string;
    cost: string;
  }>(
    `SELECT
      DATE(s.started_at) as date,
      COUNT(DISTINCT s.id) as sessions,
      COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as tokens,
      COALESCE(SUM(e.estimated_cost), 0) as cost
    FROM sessions s
    LEFT JOIN events e ON e.session_id = s.id
    WHERE s.organization_id = $1 AND s.machine_id = $2
      AND s.started_at >= NOW() - INTERVAL '1 day' * $3
    GROUP BY DATE(s.started_at)
    ORDER BY date ASC`,
    [orgId, machineId, days]
  );

  return rows.map((row) => ({
    date: row.date,
    sessions: parseInt(row.sessions, 10),
    tokens: parseInt(row.tokens, 10),
    cost: parseFloat(row.cost),
  }));
}

export async function getMachineProviderBreakdown(
  orgId: string,
  machineId: string
): Promise<MachineProviderBreakdown[]> {
  const rows = await query<{
    provider: string;
    sessions: string;
    tokens: string;
    cost: string;
  }>(
    `SELECT
      p.name as provider,
      COUNT(DISTINCT s.id) as sessions,
      COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as tokens,
      COALESCE(SUM(e.estimated_cost), 0) as cost
    FROM sessions s
    JOIN providers p ON s.provider_id = p.id
    LEFT JOIN events e ON e.session_id = s.id
    WHERE s.organization_id = $1 AND s.machine_id = $2
    GROUP BY p.name
    ORDER BY cost DESC`,
    [orgId, machineId]
  );

  return rows.map((row) => ({
    provider: row.provider,
    sessions: parseInt(row.sessions, 10),
    tokens: parseInt(row.tokens, 10),
    cost: parseFloat(row.cost),
  }));
}

export async function getMachineModelBreakdown(
  orgId: string,
  machineId: string
): Promise<MachineModelBreakdown[]> {
  const rows = await query<{
    model: string;
    sessions: string;
    tokens: string;
    cost: string;
  }>(
    `SELECT
      e.model,
      COUNT(DISTINCT s.id) as sessions,
      COALESCE(SUM(e.input_tokens + e.output_tokens), 0) as tokens,
      COALESCE(SUM(e.estimated_cost), 0) as cost
    FROM sessions s
    JOIN events e ON e.session_id = s.id
    WHERE s.organization_id = $1 AND s.machine_id = $2
    GROUP BY e.model
    ORDER BY cost DESC`,
    [orgId, machineId]
  );

  return rows.map((row) => ({
    model: row.model,
    sessions: parseInt(row.sessions, 10),
    tokens: parseInt(row.tokens, 10),
    cost: parseFloat(row.cost),
  }));
}

export async function getMachineRecentSessions(
  orgId: string,
  machineId: string,
  limit: number = 10
): Promise<SessionListItem[]> {
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
    WHERE s.organization_id = $1 AND s.machine_id = $2
    GROUP BY s.id, p.name, u.name, u.email, m.hostname
    ORDER BY s.started_at DESC
    LIMIT $3`,
    [orgId, machineId, limit]
  );

  return rows.map((row) => {
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
}
