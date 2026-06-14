import { query } from '../../database/pool.js';
import type { UserData } from './user.factory.js';
import type { MachineData } from './machine.factory.js';

export interface SessionData {
  id: string;
  organization_id: string;
  user_id: string;
  machine_id: string;
  provider_id: number;
  external_session_id: string;
  project_name: string;
  started_at: Date;
  ended_at: Date;
  raw_metadata: Record<string, any>;
}

// Provider weights: claude 40%, codex 25%, cursor 15%, gemini 15%, other 5%
const PROVIDER_WEIGHTS = [
  { id: 1, weight: 40 },  // claude
  { id: 2, weight: 25 },  // codex
  { id: 3, weight: 15 },  // cursor
  { id: 4, weight: 15 },  // gemini
  { id: 5, weight: 3 },   // warp
  { id: 6, weight: 2 },   // opencode
];

const PROJECT_NAMES = [
  'api-gateway', 'dashboard-v2', 'auth-service', 'data-pipeline', 'mobile-app',
  'payment-service', 'notification-hub', 'search-engine', 'user-management',
  'analytics-dashboard', 'ml-pipeline', 'content-cms', 'billing-service',
  'inventory-api', 'chat-service', 'file-storage', 'email-worker', 'cache-layer',
  'monitoring-agent', 'deploy-tool', 'ci-runner', 'test-framework', 'docs-site',
  'admin-panel', 'worker-queue', 'graphql-api', 'websocket-server', 'cdn-proxy',
  'log-aggregator', 'secret-vault', 'config-service', 'rate-limiter',
];

const METADATA_TEMPLATES = [
  { version: '1.0.0', ide: 'vscode', theme: 'dark' },
  { version: '2.1.0', ide: 'cursor', theme: 'light' },
  { version: '1.5.3', ide: 'jetbrains', theme: 'dark' },
  { version: '3.0.0', ide: 'neovim', theme: 'monokai' },
  { version: '1.2.0', ide: 'vscode', theme: 'solarized' },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom(weights: typeof PROVIDER_WEIGHTS): number {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.id;
  }
  return weights[0].id;
}

function generateExternalSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createSessions(
  users: UserData[],
  machines: MachineData[],
  sessionsPerUser: number = 20
): Promise<SessionData[]> {
  const allSessions: SessionData[] = [];
  const now = Date.now();
  const twelveMonthsAgo = now - 365 * 24 * 60 * 60 * 1000;
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

  // Build a map of user_id -> machines for quick lookup
  const userMachines = new Map<string, MachineData[]>();
  for (const machine of machines) {
    const list = userMachines.get(machine.user_id) || [];
    list.push(machine);
    userMachines.set(machine.user_id, list);
  }

  const batchSize = 50;

  for (let batch = 0; batch < users.length; batch += batchSize) {
    const batchUsers = users.slice(batch, batch + batchSize);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const user of batchUsers) {
      const userMachineList = userMachines.get(user.id) || [];
      if (userMachineList.length === 0) continue;

      const numSessions = randomBetween(
        Math.floor(sessionsPerUser * 0.5),
        Math.floor(sessionsPerUser * 1.5)
      );

      for (let i = 0; i < numSessions; i++) {
        const machine = randomFrom(userMachineList);
        const providerId = weightedRandom(PROVIDER_WEIGHTS);

        // Sessions weighted toward last 6 months, but some older
        const startTime = Math.random() < 0.7
          ? sixMonthsAgo + Math.random() * (now - sixMonthsAgo)
          : twelveMonthsAgo + Math.random() * (now - twelveMonthsAgo);

        // Weekday bias: reduce sessions on weekends
        const startDate = new Date(startTime);
        const dayOfWeek = startDate.getDay();
        if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.6) {
          continue; // Skip ~60% of weekend sessions
        }

        // Session duration: 5 minutes to 4 hours
        const durationMs = randomBetween(5 * 60 * 1000, 4 * 60 * 60 * 1000);
        const endTime = new Date(startTime + durationMs);

        const metadata = randomFrom(METADATA_TEMPLATES);

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}::jsonb)`
        );
        params.push(
          user.organization_id,
          user.id,
          machine.id,
          providerId,
          generateExternalSessionId(),
          randomFrom(PROJECT_NAMES),
          new Date(startTime),
          endTime,
          JSON.stringify(metadata)
        );
        paramIdx += 10;
      }
    }

    if (values.length === 0) continue;

    const result = await query<SessionData>(
      `INSERT INTO sessions (organization_id, user_id, machine_id, provider_id, external_session_id, project_name, started_at, ended_at, raw_metadata)
       VALUES ${values.join(', ')}
       ON CONFLICT DO NOTHING
       RETURNING id, organization_id, user_id, machine_id, provider_id, external_session_id, project_name, started_at, ended_at, raw_metadata`,
      params
    );
    allSessions.push(...result.rows);
  }

  return allSessions;
}
