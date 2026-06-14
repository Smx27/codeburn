import { queryOne, queryMany } from '../database/pool.js';

export interface Provider {
  id: number;
  name: string;
}

const providerCache = new Map<string, number>();

export async function getProviderId(name: string): Promise<number> {
  // Check cache first
  if (providerCache.has(name)) {
    return providerCache.get(name)!;
  }

  const provider = await queryOne<Provider>(
    'SELECT id, name FROM providers WHERE name = $1',
    [name]
  );

  if (!provider) {
    throw new Error(`Provider not found: ${name}`);
  }

  providerCache.set(name, provider.id);
  return provider.id;
}

export async function getProviderName(id: number): Promise<string | null> {
  const provider = await queryOne<Provider>(
    'SELECT id, name FROM providers WHERE id = $1',
    [id]
  );
  return provider?.name ?? null;
}

export async function getAllProviders(): Promise<Provider[]> {
  return queryMany<Provider>('SELECT id, name FROM providers ORDER BY id');
}

export async function ensureProvider(name: string): Promise<number> {
  const existing = await queryOne<Provider>(
    'SELECT id, name FROM providers WHERE name = $1',
    [name]
  );
  if (existing) {
    providerCache.set(name, existing.id);
    return existing.id;
  }

  // Get next available ID
  const maxIdResult = await queryOne<{ max_id: number }>(
    'SELECT COALESCE(MAX(id), 0) as max_id FROM providers'
  );
  const nextId = (maxIdResult?.max_id ?? 0) + 1;

  await queryOne(
    'INSERT INTO providers (id, name) VALUES ($1, $2)',
    [nextId, name]
  );

  providerCache.set(name, nextId);
  return nextId;
}