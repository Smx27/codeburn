import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { SyncStateRecord, SourceStats } from '../types/sync.types.js';

const SYNC_STATE_DIR = join(homedir(), '.config', 'aiinsight', 'sync-state');

interface LocalSyncStateRecord {
  organizationId: string;
  machineId: string;
  provider: string;
  sourceIdentifier: string;
  sourcePath: string;
  lastProcessedAt?: string;
  lastHash?: string;
  updatedAt: string;
}

function getStateFilePath(orgId: string, machineId: string, provider: string, sourceIdentifier: string): string {
  const hash = createHash('sha256').update(`${orgId}:${machineId}:${provider}:${sourceIdentifier}`).digest('hex').slice(0, 16);
  return join(SYNC_STATE_DIR, `${provider}_${hash}.json`);
}

async function ensureStateDir(): Promise<void> {
  await mkdir(SYNC_STATE_DIR, { recursive: true });
}

export async function getSyncState(
  orgId: string,
  machineId: string,
  provider: string,
  sourceIdentifier: string
): Promise<SyncStateRecord | null> {
  const filePath = getStateFilePath(orgId, machineId, provider, sourceIdentifier);
  
  try {
    const content = await readFile(filePath, 'utf-8');
    const record = JSON.parse(content) as LocalSyncStateRecord;
    return {
      organizationId: record.organizationId,
      machineId: record.machineId,
      provider: record.provider,
      sourceIdentifier: record.sourceIdentifier,
      lastProcessedAt: record.lastProcessedAt ? new Date(record.lastProcessedAt) : undefined,
      lastHash: record.lastHash,
      updatedAt: new Date(record.updatedAt),
    };
  } catch {
    return null;
  }
}

export async function upsertSyncState(record: SyncStateRecord): Promise<void> {
  await ensureStateDir();
  const filePath = getStateFilePath(record.organizationId, record.machineId, record.provider, record.sourceIdentifier);
  
  const localRecord: LocalSyncStateRecord = {
    organizationId: record.organizationId,
    machineId: record.machineId,
    provider: record.provider,
    sourceIdentifier: record.sourceIdentifier,
    sourcePath: record.sourceIdentifier,
    lastProcessedAt: record.lastProcessedAt instanceof Date ? record.lastProcessedAt.toISOString() : record.lastProcessedAt,
    lastHash: record.lastHash,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
  };
  
  await writeFile(filePath, JSON.stringify(localRecord, null, 2), 'utf-8');
}

export async function markSynced(
  orgId: string,
  machineId: string,
  provider: string,
  sourceIdentifier: string,
  hash: string
): Promise<void> {
  const existing = await getSyncState(orgId, machineId, provider, sourceIdentifier);
  await upsertSyncState({
    organizationId: orgId,
    machineId,
    provider,
    sourceIdentifier,
    lastProcessedAt: new Date(),
    lastHash: hash,
    updatedAt: new Date(),
  });
}

export async function computeFileChecksum(filePath: string): Promise<string> {
  const { readFile } = await import('fs/promises');
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export async function getSourceStats(filePath: string): Promise<SourceStats> {
  const { stat } = await import('fs/promises');
  const stats = await stat(filePath);
  const checksum = await computeFileChecksum(filePath);
  
  return {
    path: filePath,
    size: stats.size,
    checksum,
    modifiedAt: stats.mtime,
  };
}

export function isSourceUnchanged(state: SyncStateRecord | null, stats: SourceStats): boolean {
  if (!state) return false;
  if (!state.lastHash) return false;
  return state.lastHash === stats.checksum;
}