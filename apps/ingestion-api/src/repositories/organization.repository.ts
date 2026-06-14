import { queryOne, queryMany, query } from '../database/pool.js';

export interface Organization {
  id: string;
  name: string;
  created_at: Date;
}

export async function findOrganizationById(id: string): Promise<Organization | null> {
  return queryOne<Organization>(
    'SELECT id, name, created_at FROM organizations WHERE id = $1',
    [id]
  );
}

export async function createOrganization(name: string): Promise<Organization> {
  const result = await query<Organization>(
    'INSERT INTO organizations (name) VALUES ($1) RETURNING id, name, created_at',
    [name]
  );
  return result.rows[0];
}

export async function findOrCreateOrganization(name: string): Promise<Organization> {
  const existing = await queryOne<Organization>(
    'SELECT id, name, created_at FROM organizations WHERE name = $1',
    [name]
  );
  if (existing) return existing;
  return createOrganization(name);
}