import { query } from '../../database/pool.js';
import type { SessionData } from './session.factory.js';

export interface EventData {
  id: number;
  organization_id: string;
  session_id: string;
  event_time: Date;
  event_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  estimated_cost: number;
  payload: Record<string, any>;
}

// Model definitions per provider
const MODELS_BY_PROVIDER: Record<number, { model: string; costPerInputToken: number; costPerOutputToken: number }[]> = {
  1: [ // claude
    { model: 'claude-opus-4', costPerInputToken: 0.000015, costPerOutputToken: 0.000075 },
    { model: 'claude-sonnet-4', costPerInputToken: 0.000003, costPerOutputToken: 0.000015 },
  ],
  2: [ // codex
    { model: 'gpt-5', costPerInputToken: 0.00001, costPerOutputToken: 0.00003 },
    { model: 'gpt-4.1', costPerInputToken: 0.000002, costPerOutputToken: 0.000008 },
  ],
  3: [ // cursor
    { model: 'claude-sonnet-4', costPerInputToken: 0.000003, costPerOutputToken: 0.000015 },
    { model: 'gpt-4.1', costPerInputToken: 0.000002, costPerOutputToken: 0.000008 },
  ],
  4: [ // gemini
    { model: 'gemini-2.5-pro', costPerInputToken: 0.00000125, costPerOutputToken: 0.00001 },
    { model: 'gemini-2.5-flash', costPerInputToken: 0.000000075, costPerOutputToken: 0.0000003 },
  ],
  5: [ // warp
    { model: 'claude-sonnet-4', costPerInputToken: 0.000003, costPerOutputToken: 0.000015 },
  ],
  6: [ // opencode
    { model: 'claude-sonnet-4', costPerInputToken: 0.000003, costPerOutputToken: 0.000015 },
  ],
};

const EVENT_TYPES = ['message', 'tool_call', 'completion'];
const EVENT_TYPE_WEIGHTS = [
  { type: 'message', weight: 50 },
  { type: 'tool_call', weight: 35 },
  { type: 'completion', weight: 15 },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedEventType(): string {
  const total = EVENT_TYPE_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const w of EVENT_TYPE_WEIGHTS) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return EVENT_TYPE_WEIGHTS[0].type;
}

function selectModel(providerId: number): { model: string; costPerInputToken: number; costPerOutputToken: number } {
  const models = MODELS_BY_PROVIDER[providerId] || MODELS_BY_PROVIDER[1];
  return randomFrom(models);
}

export async function createEvents(
  sessions: SessionData[],
  eventsPerSession: number = 15
): Promise<void> {
  const batchSize = 200;

  for (let batch = 0; batch < sessions.length; batch += batchSize) {
    const batchSessions = sessions.slice(batch, batch + batchSize);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const session of batchSessions) {
      const numEvents = randomBetween(
        Math.floor(eventsPerSession * 0.3),
        Math.floor(eventsPerSession * 2)
      );

      const sessionStart = session.started_at.getTime();
      const sessionEnd = session.ended_at.getTime();
      const sessionDuration = sessionEnd - sessionStart;

      for (let i = 0; i < numEvents; i++) {
        const eventTime = new Date(sessionStart + Math.random() * sessionDuration);
        const eventType = weightedEventType();
        const modelInfo = selectModel(session.provider_id);

        const inputTokens = randomBetween(500, 10000);
        const outputTokens = randomBetween(200, 5000);
        const cacheReadTokens = Math.random() < 0.4 ? randomBetween(100, 3000) : 0;
        const cacheWriteTokens = Math.random() < 0.2 ? randomBetween(50, 1500) : 0;

        const estimatedCost =
          inputTokens * modelInfo.costPerInputToken +
          outputTokens * modelInfo.costPerOutputToken +
          cacheReadTokens * modelInfo.costPerInputToken * 0.1 +
          cacheWriteTokens * modelInfo.costPerOutputToken * 0.5;

        const payload = {
          model: modelInfo.model,
          tokens: { input: inputTokens, output: outputTokens },
          cache: { read: cacheReadTokens, write: cacheWriteTokens },
        };

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10}, $${paramIdx + 11}::jsonb)`
        );
        params.push(
          session.organization_id,
          session.id,
          eventTime,
          eventType,
          modelInfo.model,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheWriteTokens,
          estimatedCost.toFixed(8),
          JSON.stringify(payload)
        );
        paramIdx += 12;
      }
    }

    if (values.length === 0) continue;

    await query(
      `INSERT INTO events (organization_id, session_id, event_time, event_type, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost, payload)
       VALUES ${values.join(', ')}
       ON CONFLICT DO NOTHING`,
      params
    );
  }
}
