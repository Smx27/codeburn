import dotenv from 'dotenv';
dotenv.config();

import { query, closePool } from '../database/pool.js';
import { createOrganizations } from './factories/organization.factory.js';
import { createUsers } from './factories/user.factory.js';
import { createMachines } from './factories/machine.factory.js';
import { createSessions } from './factories/session.factory.js';
import { createEvents } from './factories/event.factory.js';

const USERS_PER_ORG = 80;
const MACHINES_PER_USER = 2;
const MONTHS_OF_DATA = 6;
const GROWTH_RATES = [0.0, 0.20, 0.20, 0.25, 0.20, 0.25];
const BASE_TOKENS_PER_DAY = 500;
const WEEKDAY_MULTIPLIER = 3;
const RANDOMIZATION_RANGE = 0.15;

const PROVIDER_WEIGHTS = [
  { id: 1, weight: 40 },
  { id: 2, weight: 25 },
  { id: 3, weight: 15 },
  { id: 4, weight: 15 },
  { id: 5, weight: 3 },
  { id: 6, weight: 2 },
];

const MODELS_BY_PROVIDER: Record<number, string[]> = {
  1: ['claude-opus-4', 'claude-sonnet-4'],
  2: ['gpt-5', 'gpt-4.1'],
  3: ['claude-sonnet-4', 'gpt-4.1'],
  4: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  5: ['claude-sonnet-4'],
  6: ['claude-sonnet-4'],
};

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-opus-4': { input: 0.000015, output: 0.000075 },
  'claude-sonnet-4': { input: 0.000003, output: 0.000015 },
  'gpt-5': { input: 0.00001, output: 0.00003 },
  'gpt-4.1': { input: 0.000002, output: 0.000008 },
  'gemini-2.5-pro': { input: 0.00000125, output: 0.00001 },
  'gemini-2.5-flash': { input: 0.000000075, output: 0.0000003 },
};

const HERO_USER_NAMES = [
  'Alex Rivera', 'Jordan Chen', 'Sam Patel', 'Casey Kim', 'Morgan Lee',
];

function weightedRandom(weights: typeof PROVIDER_WEIGHTS): number {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.id;
  }
  return weights[0].id;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['claude-sonnet-4'];
  return inputTokens * costs.input + outputTokens * costs.output;
}

async function seed() {
  console.log('\n=== AiInsight Demo Seed ===\n');

  // 1. Create base entities using existing factories
  console.log('Creating organizations...');
  const organizations = await createOrganizations();
  console.log(`  Created ${organizations.length} organizations`);

  console.log(`Creating users (${USERS_PER_ORG}/org)...`);
  const users = await createUsers(organizations, USERS_PER_ORG);
  console.log(`  Created ${users.length} users`);

  console.log(`Creating machines (${MACHINES_PER_USER}/user)...`);
  const machines = await createMachines(users, MACHINES_PER_USER);
  console.log(`  Created ${machines.length} machines`);

  // Mark some users as heroes
  const heroUserIds = new Set<string>();
  for (const name of HERO_USER_NAMES) {
    const user = users.find(u => u.name === name);
    if (user) heroUserIds.add(user.id);
  }
  // If not enough hero users found, pick random ones
  while (heroUserIds.size < 5) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    heroUserIds.add(randomUser.id);
  }

  console.log(`Creating sessions...`);
  const sessions = await createSessions(users, machines, 20);
  console.log(`  Created ${sessions.length} sessions`);

  console.log('Creating events...');
  await createEvents(sessions, 15);
  console.log('  Events created');

  // 2. Generate aggregation tables directly
  console.log('\nGenerating aggregation tables...');

  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - MONTHS_OF_DATA);
  startDate.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

  // Build user->org mapping
  const userOrgMap = new Map<string, string>();
  for (const user of users) {
    userOrgMap.set(user.id, user.organization_id);
  }

  // daily_usage per org
  console.log('  Inserting daily_usage...');
  for (const org of organizations) {
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      const monthIndex = Math.min(
        Math.floor(dayOffset / 30),
        GROWTH_RATES.length - 1
      );

      let baseTokens = BASE_TOKENS_PER_DAY;
      for (let m = 1; m <= monthIndex; m++) {
        baseTokens *= (1 + GROWTH_RATES[m]);
      }

      if (isWeekend(date)) {
        baseTokens = Math.floor(baseTokens / WEEKDAY_MULTIPLIER);
      }

      const jitter = 1 + (Math.random() * 2 - 1) * RANDOMIZATION_RANGE;
      const totalTokens = Math.floor(baseTokens * jitter);
      const inputTokens = Math.floor(totalTokens * 0.65);
      const outputTokens = totalTokens - inputTokens;

      // Hero users contribute 20-30% extra
      const heroBonus = Math.floor(totalTokens * (0.2 + Math.random() * 0.1));
      const finalTokens = totalTokens + heroBonus;

      const cost = calculateCost('claude-sonnet-4', inputTokens, outputTokens) +
        calculateCost('gpt-4.1', Math.floor(outputTokens * 0.3), Math.floor(outputTokens * 0.1));

      const sessionsToday = Math.floor(finalTokens / 15) + randomBetween(1, 5);
      const usersToday = Math.floor(USERS_PER_ORG * (0.3 + Math.random() * 0.4));

      values.push(
        `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7})`
      );
      params.push(
        org.id,
        date.toISOString().split('T')[0],
        sessionsToday,
        usersToday,
        inputTokens,
        outputTokens,
        finalTokens,
        cost.toFixed(8)
      );
      paramIdx += 8;
    }

    // Batch insert in chunks of 100
    for (let i = 0; i < values.length; i += 100) {
      const chunk = values.slice(i, i + 100);
      const chunkParams = params.slice(i * 8, (i + 100) * 8);
      await query(
        `INSERT INTO daily_usage (organization_id, usage_date, total_sessions, total_users, total_input_tokens, total_output_tokens, total_tokens, total_cost)
         VALUES ${chunk.join(', ')}
         ON CONFLICT (organization_id, usage_date) DO NOTHING`,
        chunkParams
      );
    }
  }

  // daily_provider_usage per org
  console.log('  Inserting daily_provider_usage...');
  for (const org of organizations) {
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      const monthIndex = Math.min(
        Math.floor(dayOffset / 30),
        GROWTH_RATES.length - 1
      );

      let baseTokens = BASE_TOKENS_PER_DAY;
      for (let m = 1; m <= monthIndex; m++) {
        baseTokens *= (1 + GROWTH_RATES[m]);
      }

      if (isWeekend(date)) {
        baseTokens = Math.floor(baseTokens / WEEKDAY_MULTIPLIER);
      }

      const jitter = 1 + (Math.random() * 2 - 1) * RANDOMIZATION_RANGE;
      const dayTokens = Math.floor(baseTokens * jitter);

      for (const pw of PROVIDER_WEIGHTS) {
        const providerTokens = Math.floor(dayTokens * (pw.weight / 100));
        if (providerTokens === 0) continue;

        const model = MODELS_BY_PROVIDER[pw.id]?.[0] || 'claude-sonnet-4';
        const cost = calculateCost(model, Math.floor(providerTokens * 0.65), Math.floor(providerTokens * 0.35));
        const sessionsForProvider = Math.floor(providerTokens / 15) + randomBetween(0, 2);

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`
        );
        params.push(
          org.id,
          pw.id,
          date.toISOString().split('T')[0],
          sessionsForProvider,
          providerTokens,
          cost.toFixed(8)
        );
        paramIdx += 6;
      }
    }

    for (let i = 0; i < values.length; i += 100) {
      const chunk = values.slice(i, i + 100);
      const chunkParams = params.slice(i * 6, (i + 100) * 6);
      await query(
        `INSERT INTO daily_provider_usage (organization_id, provider_id, usage_date, total_sessions, total_tokens, total_cost)
         VALUES ${chunk.join(', ')}
         ON CONFLICT (organization_id, provider_id, usage_date) DO NOTHING`,
        chunkParams
      );
    }
  }

  // daily_model_usage per org
  console.log('  Inserting daily_model_usage...');
  for (const org of organizations) {
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      const monthIndex = Math.min(
        Math.floor(dayOffset / 30),
        GROWTH_RATES.length - 1
      );

      let baseTokens = BASE_TOKENS_PER_DAY;
      for (let m = 1; m <= monthIndex; m++) {
        baseTokens *= (1 + GROWTH_RATES[m]);
      }

      if (isWeekend(date)) {
        baseTokens = Math.floor(baseTokens / WEEKDAY_MULTIPLIER);
      }

      const jitter = 1 + (Math.random() * 2 - 1) * RANDOMIZATION_RANGE;
      const dayTokens = Math.floor(baseTokens * jitter);

      for (const pw of PROVIDER_WEIGHTS) {
        const models = MODELS_BY_PROVIDER[pw.id] || ['claude-sonnet-4'];
        const providerShare = pw.weight / 100;

        for (const model of models) {
          const modelTokens = Math.floor(dayTokens * providerShare / models.length);
          if (modelTokens === 0) continue;

          const cost = calculateCost(model, Math.floor(modelTokens * 0.65), Math.floor(modelTokens * 0.35));
          const sessionsForModel = Math.floor(modelTokens / 15) + randomBetween(0, 1);

          values.push(
            `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`
          );
          params.push(
            org.id,
            model,
            date.toISOString().split('T')[0],
            modelTokens,
            cost.toFixed(8),
            sessionsForModel
          );
          paramIdx += 6;
        }
      }
    }

    for (let i = 0; i < values.length; i += 100) {
      const chunk = values.slice(i, i + 100);
      const chunkParams = params.slice(i * 6, (i + 100) * 6);
      await query(
        `INSERT INTO daily_model_usage (organization_id, model, usage_date, total_tokens, total_cost, session_count)
         VALUES ${chunk.join(', ')}
         ON CONFLICT (organization_id, model, usage_date) DO NOTHING`,
        chunkParams
      );
    }
  }

  // daily_user_usage per org
  console.log('  Inserting daily_user_usage...');
  for (const org of organizations) {
    const orgUsers = users.filter(u => u.organization_id === org.id);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      const monthIndex = Math.min(
        Math.floor(dayOffset / 30),
        GROWTH_RATES.length - 1
      );

      let baseTokens = BASE_TOKENS_PER_DAY;
      for (let m = 1; m <= monthIndex; m++) {
        baseTokens *= (1 + GROWTH_RATES[m]);
      }

      if (isWeekend(date)) {
        baseTokens = Math.floor(baseTokens / WEEKDAY_MULTIPLIER);
      }

      // Each active user gets a share of the daily tokens
      const activeUsers = Math.floor(orgUsers.length * (0.3 + Math.random() * 0.4));
      const shuffled = [...orgUsers].sort(() => Math.random() - 0.5);
      const activeUserList = shuffled.slice(0, activeUsers);

      for (const user of activeUserList) {
        const isHero = heroUserIds.has(user.id);
        const userShare = isHero ? 0.08 + Math.random() * 0.05 : 0.01 + Math.random() * 0.02;
        const userTokens = Math.floor(baseTokens * userShare * (1 + (Math.random() * 2 - 1) * RANDOMIZATION_RANGE));
        const userSessions = Math.max(1, Math.floor(userTokens / 15));
        const cost = calculateCost('claude-sonnet-4', Math.floor(userTokens * 0.65), Math.floor(userTokens * 0.35));

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`
        );
        params.push(
          org.id,
          user.id,
          date.toISOString().split('T')[0],
          userSessions,
          userTokens,
          cost.toFixed(8)
        );
        paramIdx += 6;
      }
    }

    for (let i = 0; i < values.length; i += 100) {
      const chunk = values.slice(i, i + 100);
      const chunkParams = params.slice(i * 6, (i + 100) * 6);
      await query(
        `INSERT INTO daily_user_usage (organization_id, user_id, usage_date, session_count, token_count, cost)
         VALUES ${chunk.join(', ')}
         ON CONFLICT (organization_id, user_id, usage_date) DO NOTHING`,
        chunkParams
      );
    }
  }

  // daily_project_usage per org
  console.log('  Inserting daily_project_usage...');
  const projectNames = [
    'api-gateway', 'dashboard-v2', 'auth-service', 'data-pipeline', 'mobile-app',
    'payment-service', 'notification-hub', 'search-engine', 'user-management',
    'analytics-dashboard', 'ml-pipeline', 'content-cms', 'billing-service',
  ];

  for (const org of organizations) {
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      const monthIndex = Math.min(
        Math.floor(dayOffset / 30),
        GROWTH_RATES.length - 1
      );

      let baseTokens = BASE_TOKENS_PER_DAY;
      for (let m = 1; m <= monthIndex; m++) {
        baseTokens *= (1 + GROWTH_RATES[m]);
      }

      if (isWeekend(date)) {
        baseTokens = Math.floor(baseTokens / WEEKDAY_MULTIPLIER);
      }

      // Distribute tokens across projects with Zipf-like distribution
      const activeProjects = randomBetween(5, projectNames.length);
      const projectTokensRemaining = baseTokens;

      for (let p = 0; p < activeProjects; p++) {
        const projectName = projectNames[p];
        // Zipf distribution: project at rank p gets 1/(p+1) share
        const zipfWeight = 1 / (p + 1);
        const totalZipfWeight = Array.from({ length: activeProjects }, (_, i) => 1 / (i + 1))
          .reduce((a, b) => a + b, 0);
        const projectTokens = Math.floor(projectTokensRemaining * (zipfWeight / totalZipfWeight));

        if (projectTokens === 0) continue;

        const cost = calculateCost('claude-sonnet-4', Math.floor(projectTokens * 0.65), Math.floor(projectTokens * 0.35));
        const sessionsForProject = Math.max(1, Math.floor(projectTokens / 15));

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`
        );
        params.push(
          org.id,
          projectName,
          date.toISOString().split('T')[0],
          sessionsForProject,
          projectTokens,
          cost.toFixed(8)
        );
        paramIdx += 6;
      }
    }

    for (let i = 0; i < values.length; i += 100) {
      const chunk = values.slice(i, i + 100);
      const chunkParams = params.slice(i * 6, (i + 100) * 6);
      await query(
        `INSERT INTO daily_project_usage (organization_id, project_name, usage_date, session_count, token_count, cost)
         VALUES ${chunk.join(', ')}
         ON CONFLICT (organization_id, project_name, usage_date) DO NOTHING`,
        chunkParams
      );
    }
  }

  // Summary
  const counts = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) as count FROM daily_usage'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM daily_provider_usage'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM daily_model_usage'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM daily_user_usage'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM daily_project_usage'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM events'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM sessions'),
  ]);

  console.log('\n=== Demo Seed Complete ===');
  console.log(`Organizations: ${organizations.length}`);
  console.log(`Users: ${users.length} (including ${HERO_USER_NAMES.length} hero users)`);
  console.log(`Machines: ${machines.length}`);
  console.log(`Sessions: ${counts[6].rows[0].count}`);
  console.log(`Events: ${counts[5].rows[0].count}`);
  console.log(`\nAggregation rows:`);
  console.log(`  daily_usage: ${counts[0].rows[0].count}`);
  console.log(`  daily_provider_usage: ${counts[1].rows[0].count}`);
  console.log(`  daily_model_usage: ${counts[2].rows[0].count}`);
  console.log(`  daily_user_usage: ${counts[3].rows[0].count}`);
  console.log(`  daily_project_usage: ${counts[4].rows[0].count}`);
  console.log('');
}

seed()
  .catch((err) => {
    console.error('Demo seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    closePool();
  });
