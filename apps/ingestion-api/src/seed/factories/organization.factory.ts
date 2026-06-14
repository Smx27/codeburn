import { query } from '../../database/pool.js';

export interface OrganizationData {
  id: string;
  name: string;
}

const ORGANIZATION_NAMES = [
  'Acme Technologies',
  'Nova Labs',
  'CloudScale',
  'DevForge',
];

export async function createOrganizations(): Promise<OrganizationData[]> {
  const organizations: OrganizationData[] = [];

  for (const name of ORGANIZATION_NAMES) {
    const result = await query<OrganizationData>(
      `INSERT INTO organizations (name) VALUES ($1)
       ON CONFLICT DO NOTHING
       RETURNING id, name`,
      [name]
    );
    if (result.rows.length > 0) {
      organizations.push(result.rows[0]);
    } else {
      const existing = await query<OrganizationData>('SELECT id, name FROM organizations WHERE name = $1', [name]);
      if (existing.rows[0]) organizations.push(existing.rows[0]);
    }
  }

  return organizations;
}
