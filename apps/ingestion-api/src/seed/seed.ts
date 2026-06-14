import dotenv from 'dotenv';
dotenv.config();

import { query, closePool } from '../database/pool.js';
import { createOrganizations } from './factories/organization.factory.js';
import { createUsers } from './factories/user.factory.js';
import { createMachines } from './factories/machine.factory.js';
import { createSessions } from './factories/session.factory.js';
import { createEvents } from './factories/event.factory.js';

type SeedSize = 'small' | 'medium' | 'large';

interface SeedConfig {
  size: SeedSize;
  usersPerOrg: number;
  eventsTarget: number;
  machinesPerUser: number;
}

const SIZE_CONFIGS: Record<SeedSize, SeedConfig> = {
  small: { size: 'small', usersPerOrg: 25, eventsTarget: 10_000, machinesPerUser: 1 },
  medium: { size: 'medium', usersPerOrg: 75, eventsTarget: 100_000, machinesPerUser: 2 },
  large: { size: 'large', usersPerOrg: 150, eventsTarget: 1_000_000, machinesPerUser: 2 },
};

const AVG_EVENTS_PER_SESSION = 15;

function parseArgs(): { size: SeedSize; reset: boolean } {
  const args = process.argv.slice(2);
  let size: SeedSize = 'medium';
  let reset = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--size' && args[i + 1]) {
      const val = args[i + 1].toLowerCase();
      if (val === 'small' || val === 'medium' || val === 'large') {
        size = val;
      }
      i++;
    }
    if (args[i] === '--reset') {
      reset = true;
    }
  }

  return { size, reset };
}

async function resetData(): Promise<void> {
  console.log('Resetting existing data...');
  const tables = [
    'daily_project_usage',
    'daily_user_usage',
    'daily_model_usage',
    'daily_provider_usage',
    'daily_usage',
    'events',
    'sessions',
    'machines',
    'users',
    'organizations',
  ];

  for (const table of tables) {
    await query(`TRUNCATE TABLE ${table} CASCADE`);
    console.log(`  Truncated ${table}`);
  }
  console.log('Reset complete.');
}

async function seed() {
  const { size, reset } = parseArgs();
  const config = SIZE_CONFIGS[size];

  console.log(`\n=== AiInsight Seed (${config.size}) ===`);
  console.log(`Target: ~${config.eventsTarget.toLocaleString()} events\n`);

  if (config.eventsTarget === 0) {
    console.error('Events target must be greater than 0');
    process.exit(1);
  }

  if (reset) {
    await resetData();
  }

  // 1. Create organizations
  console.log('Creating organizations...');
  const organizations = await createOrganizations();
  console.log(`  Created ${organizations.length} organizations`);

  // 2. Create users
  console.log(`Creating users (${config.usersPerOrg}/org)...`);
  const users = await createUsers(organizations, config.usersPerOrg);
  console.log(`  Created ${users.length} users`);

  // 3. Create machines
  console.log(`Creating machines (${config.machinesPerUser}/user)...`);
  const machines = await createMachines(users, config.machinesPerUser);
  console.log(`  Created ${machines.length} machines`);

  // 4. Calculate sessions needed
  const totalUsers = users.length;
  const sessionsNeeded = Math.ceil(config.eventsTarget / AVG_EVENTS_PER_SESSION);
  const sessionsPerUser = Math.max(1, Math.ceil(sessionsNeeded / totalUsers));

  // 5. Create sessions
  console.log(`Creating sessions (~${sessionsNeeded.toLocaleString()} target, ${sessionsPerUser}/user)...`);
  const sessions = await createSessions(users, machines, sessionsPerUser);
  console.log(`  Created ${sessions.length} sessions`);

  // 6. Create events
  const eventsPerSession = Math.max(1, Math.ceil(config.eventsTarget / sessions.length));
  console.log(`Creating events (${eventsPerSession}/session)...`);
  await createEvents(sessions, eventsPerSession);
  console.log('  Events created');

  // 7. Summary
  const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM events');
  const totalEvents = parseInt(countResult.rows[0].count, 10);

  console.log(`\n=== Seed Complete (${config.size}) ===`);
  console.log(`Organizations: ${organizations.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Machines: ${machines.length}`);
  console.log(`Sessions: ${sessions.length}`);
  console.log(`Events: ${totalEvents.toLocaleString()}`);
  console.log('');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    closePool();
  });
