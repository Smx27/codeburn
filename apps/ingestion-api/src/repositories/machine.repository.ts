import { queryOne, query } from '../database/pool.js';

export interface Machine {
  id: string;
  organization_id: string;
  user_id: string;
  hostname: string;
  os: string | null;
  first_seen: Date;
  last_seen: Date;
}

export async function findMachineById(id: string): Promise<Machine | null> {
  return queryOne<Machine>(
    'SELECT id, organization_id, user_id, hostname, os, first_seen, last_seen FROM machines WHERE id = $1',
    [id]
  );
}

export async function findMachineByHostname(orgId: string, hostname: string): Promise<Machine | null> {
  return queryOne<Machine>(
    'SELECT id, organization_id, user_id, hostname, os, first_seen, last_seen FROM machines WHERE organization_id = $1 AND hostname = $2',
    [orgId, hostname]
  );
}

export async function createMachine(
  orgId: string,
  userId: string,
  hostname: string,
  os?: string
): Promise<Machine> {
  const result = await query<Machine>(
    `INSERT INTO machines (organization_id, user_id, hostname, os) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, organization_id, user_id, hostname, os, first_seen, last_seen`,
    [orgId, userId, hostname, os ?? null]
  );
  return result.rows[0];
}

export async function findOrCreateMachine(
  orgId: string,
  userId: string,
  hostname: string,
  os?: string
): Promise<Machine> {
  const existing = await findMachineByHostname(orgId, hostname);
  if (existing) {
    // Update last_seen
    await query(
      'UPDATE machines SET last_seen = NOW() WHERE id = $1',
      [existing.id]
    );
    return { ...existing, last_seen: new Date() };
  }
  return createMachine(orgId, userId, hostname, os);
}

export async function updateMachineLastSeen(id: string): Promise<void> {
  await query(
    'UPDATE machines SET last_seen = NOW() WHERE id = $1',
    [id]
  );
}