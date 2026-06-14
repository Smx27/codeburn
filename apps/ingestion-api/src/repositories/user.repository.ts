import { queryOne, query } from '../database/pool.js';

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string | null;
  created_at: Date;
}

export async function findUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT id, organization_id, email, name, created_at FROM users WHERE id = $1',
    [id]
  );
}

export async function findUserByEmail(orgId: string, email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT id, organization_id, email, name, created_at FROM users WHERE organization_id = $1 AND email = $2',
    [orgId, email]
  );
}

export async function createUser(orgId: string, email: string, name?: string): Promise<User> {
  const result = await query<User>(
    'INSERT INTO users (organization_id, email, name) VALUES ($1, $2, $3) RETURNING id, organization_id, email, name, created_at',
    [orgId, email, name ?? null]
  );
  return result.rows[0];
}

export async function findOrCreateUser(orgId: string, email: string, name?: string): Promise<User> {
  const existing = await findUserByEmail(orgId, email);
  if (existing) return existing;
  return createUser(orgId, email, name);
}