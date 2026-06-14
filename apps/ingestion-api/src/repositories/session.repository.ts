import { queryOne, queryMany, query } from '../database/pool.js';

export interface Session {
  id: string;
  organization_id: string;
  user_id: string;
  machine_id: string;
  provider_id: number;
  external_session_id: string;
  project_name: string | null;
  started_at: Date;
  ended_at: Date | null;
  raw_metadata: Record<string, unknown> | null;
  created_at: Date;
}

export interface UpsertSessionInput {
  organizationId: string;
  userId: string;
  machineId: string;
  providerId: number;
  externalSessionId: string;
  projectName?: string;
  startedAt: Date;
  endedAt?: Date;
  rawMetadata?: Record<string, unknown>;
}

export async function findSessionByExternalId(
  providerId: number,
  externalSessionId: string
): Promise<Session | null> {
  return queryOne<Session>(
    `SELECT id, organization_id, user_id, machine_id, provider_id, external_session_id, 
            project_name, started_at, ended_at, raw_metadata, created_at
     FROM sessions WHERE provider_id = $1 AND external_session_id = $2`,
    [providerId, externalSessionId]
  );
}

export async function upsertSession(input: UpsertSessionInput): Promise<Session> {
  const result = await query<Session>(
    `INSERT INTO sessions (organization_id, user_id, machine_id, provider_id, external_session_id, project_name, started_at, ended_at, raw_metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (provider_id, external_session_id) 
     DO UPDATE SET
       project_name = EXCLUDED.project_name,
       ended_at = EXCLUDED.ended_at,
       raw_metadata = EXCLUDED.raw_metadata
     RETURNING id, organization_id, user_id, machine_id, provider_id, external_session_id, project_name, started_at, ended_at, raw_metadata, created_at`,
    [
      input.organizationId,
      input.userId,
      input.machineId,
      input.providerId,
      input.externalSessionId,
      input.projectName ?? null,
      input.startedAt,
      input.endedAt ?? null,
      input.rawMetadata ? JSON.stringify(input.rawMetadata) : null
    ]
  );
  return result.rows[0];
}

export async function findSessionsByOrg(orgId: string, limit = 100, offset = 0): Promise<Session[]> {
  return queryMany<Session>(
    `SELECT id, organization_id, user_id, machine_id, provider_id, external_session_id, 
            project_name, started_at, ended_at, raw_metadata, created_at
     FROM sessions WHERE organization_id = $1
     ORDER BY started_at DESC LIMIT $2 OFFSET $3`,
    [orgId, limit, offset]
  );
}