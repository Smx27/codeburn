import { queryOne, queryMany, query } from '../database/pool.js';

export interface SyncSource {
  id: number;
  machine_id: string;
  provider: string;
  source_path: string;
  file_size: number;
  checksum: string | null;
  last_modified: Date | null;
  last_synced_at: Date | null;
  created_at: Date;
}

export interface UpsertSyncSourceInput {
  machineId: string;
  provider: string;
  sourcePath: string;
  fileSize?: number;
  checksum?: string;
  lastModified?: Date;
}

export async function findSyncSource(machineId: string, provider: string, sourcePath: string): Promise<SyncSource | null> {
  return queryOne<SyncSource>(
    `SELECT id, machine_id, provider, source_path, file_size, checksum, last_modified, last_synced_at, created_at
     FROM sync_sources WHERE machine_id = $1 AND provider = $2 AND source_path = $3`,
    [machineId, provider, sourcePath]
  );
}

export async function upsertSyncSource(input: UpsertSyncSourceInput): Promise<SyncSource> {
  const result = await query<SyncSource>(
    `INSERT INTO sync_sources (machine_id, provider, source_path, file_size, checksum, last_modified)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (machine_id, provider, source_path)
     DO UPDATE SET
       file_size = EXCLUDED.file_size,
       checksum = EXCLUDED.checksum,
       last_modified = EXCLUDED.last_modified
     RETURNING id, machine_id, provider, source_path, file_size, checksum, last_modified, last_synced_at, created_at`,
    [
      input.machineId,
      input.provider,
      input.sourcePath,
      input.fileSize ?? 0,
      input.checksum ?? null,
      input.lastModified ?? null
    ]
  );
  return result.rows[0];
}

export async function updateSyncSourceLastSynced(machineId: string, provider: string, sourcePath: string): Promise<void> {
  await query(
    `UPDATE sync_sources SET last_synced_at = NOW() 
     WHERE machine_id = $1 AND provider = $2 AND source_path = $3`,
    [machineId, provider, sourcePath]
  );
}

export async function findSyncSourcesByMachine(machineId: string): Promise<SyncSource[]> {
  return queryMany<SyncSource>(
    `SELECT id, machine_id, provider, source_path, file_size, checksum, last_modified, last_synced_at, created_at
     FROM sync_sources WHERE machine_id = $1
     ORDER BY provider, source_path`,
    [machineId]
  );
}