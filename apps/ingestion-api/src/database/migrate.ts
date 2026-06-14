import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  name: string;
  sql: string;
}

async function getMigrations(): Promise<Migration[]> {
  const migrationsDir = join(__dirname, 'migrations');
  const files = await readdir(migrationsDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
  
  const migrations: Migration[] = [];
  for (const file of sqlFiles) {
    const sql = await readFile(join(migrationsDir, file), 'utf-8');
    migrations.push({ name: file, sql });
  }
  return migrations;
}

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Create migrations tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrations = await getMigrations();
    
    for (const migration of migrations) {
      // Check if already applied
      const result = await pool.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [migration.name]
      );
      
      if (result.rows.length > 0) {
        console.log(`⏭  Skipping ${migration.name} (already applied)`);
        continue;
      }

      console.log(`▶  Applying ${migration.name}...`);
      await pool.query(migration.sql);
      await pool.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [migration.name]
      );
      console.log(`✓  Applied ${migration.name}`);
    }
    
    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(() => process.exit(1));