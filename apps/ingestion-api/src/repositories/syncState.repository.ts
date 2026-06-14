import { queryOne, query } from '../database/pool.js';

export interface SyncState {
  id: number;
  organization_id: string;
  machine_id: string;
  provider: string;
  source_identifier: string;
  last_processed_at: Date | null;
  last_hash: string | null;
  updated_at: Date;
}

export interface UpsertSyncStateInput {
  organizationId: string;
  machineId: string;
  provider: string;
  sourceIdentifier: string;
  lastProcessedAt?: Date;
  lastHash?: string;
}

export async function findSyncState(
  orgId: string,
  machineId: string,
  provider: string,
  sourceIdentifier: string
): Promise<SyncState | null> {
  return queryOne<SyncState>(
    `SELECT id, organization_id, machine_id, provider, source_identifier, last_processed_at, last_hash, updated_at
     FROM sync_state WHERE organization_id = $1 AND machine_id = $2 AND provider = $3 AND source_identifier = $4`,
    [orgId, machineId, provider, sourceIdentifier]
  );
}

export async function upsertSyncState(input: UpsertSyncStateInput): Promise<SyncState> {
  const result = await query<SyncState>(
    `INSERT INTO sync_state (organization_id, machine_id, provider, source_identifier, last_processed_at, last_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (organization_id, machine_id, provider, source_identifier)
     DO UPDATE SET
       last_processed_at = EXCLUDED.last_processed_at,
       last_hash = EXCLUDED.last_hash,
       updated_at = NOW()
     RETURNING id, organization_id, machine_id, provider, source_identifier, last_processed_at, last_hash, updated_at`,
    [
      input.organizationId,
      input.machineId,
      input.provider,
      input.sourceIdentifier,
      input.lastProcessedAt ?? null,
      input.lastHash ?? null
    ]
  );
  return result.rows[0];
}

export async function updateSyncStateHash(
  orgId: string,
  machineId: string,
  provider: string,
  sourceIdentifier: string,
  hash: string,
  processedAt: Date
): Promise<void> {
  await query(
    `UPDATE sync_state 
     SET last_hash = $1, last_processed_at = $2, updated_at = NOW()
     WHERE organization_id = $3 AND machine_id = $4 AND provider = $5 AND source_identifier = $6`,
    [hash, processedAt, orgId, machineId, provider, sourceIdentifier]
  );
}

export async function findSyncStatesByOrg(orgId: string): Promise<SyncState[]> {
  const { queryMany } = await import('../database/pool.js');
  return queryMany<SyncState>(
    `SELECT id, organization_id, machine_id, provider, source_identifier, last_processed_at, last_hash, updated_at
     FROM sync_state WHERE organization_id = $1
     ORDER BY provider, source_identifier`,
    [orgId]
  );
}