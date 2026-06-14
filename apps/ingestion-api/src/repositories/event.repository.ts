import pg from 'pg';
import { queryOne, queryMany, query, transaction } from '../database/pool.js';

export interface Event {
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
  payload: Record<string, unknown>;
}

export interface InsertEventInput {
  organizationId: string;
  sessionId: string;
  eventTime: Date;
  eventType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCost: number;
  payload: Record<string, unknown>;
  deduplicationKey?: string;
}

export async function insertEvents(inputs: InsertEventInput[]): Promise<{ inserted: number; duplicates: number }> {
  if (inputs.length === 0) return { inserted: 0, duplicates: 0 };

  let inserted = 0;
  let duplicates = 0;

  await transaction(async (client) => {
    for (const input of inputs) {
      // Check for duplicate if deduplicationKey provided
      if (input.deduplicationKey) {
        const existing = await client.query(
          `SELECT 1 FROM events 
           WHERE organization_id = $1 AND session_id = $2 AND (payload->>'deduplicationKey') = $3
           LIMIT 1`,
          [input.organizationId, input.sessionId, input.deduplicationKey]
        );
        if (existing.rows.length > 0) {
          duplicates++;
          continue;
        }
      }

      await client.query(
        `INSERT INTO events (organization_id, session_id, event_time, event_type, model, 
         input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          input.organizationId,
          input.sessionId,
          input.eventTime,
          input.eventType,
          input.model,
          input.inputTokens,
          input.outputTokens,
          input.cacheReadTokens,
          input.cacheWriteTokens,
          input.estimatedCost,
          JSON.stringify(input.payload)
        ]
      );
      inserted++;
    }
  });

  return { inserted, duplicates };
}

export async function findEventsBySession(sessionId: string, limit = 1000): Promise<Event[]> {
  return queryMany<Event>(
    `SELECT id, organization_id, session_id, event_time, event_type, model, 
            input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost, payload
     FROM events WHERE session_id = $1
     ORDER BY event_time ASC LIMIT $2`,
    [sessionId, limit]
  );
}

export async function findEventsByOrg(
  orgId: string, 
  options: { limit?: number; offset?: number; since?: Date; until?: Date; model?: string } = {}
): Promise<Event[]> {
  const { limit = 1000, offset = 0, since, until, model } = options;
  
  let sql = `SELECT id, organization_id, session_id, event_time, event_type, model, 
                    input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost, payload
             FROM events WHERE organization_id = $1`;
  const params: any[] = [orgId];
  let paramIndex = 2;

  if (since) {
    sql += ` AND event_time >= $${paramIndex++}`;
    params.push(since);
  }
  if (until) {
    sql += ` AND event_time <= $${paramIndex++}`;
    params.push(until);
  }
  if (model) {
    sql += ` AND model = $${paramIndex++}`;
    params.push(model);
  }

  sql += ` ORDER BY event_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  params.push(limit, offset);

  return queryMany<Event>(sql, params);
}

export async function getEventStats(orgId: string): Promise<{
  totalEvents: number;
  totalCost: number;
  totalTokens: number;
  byModel: Record<string, { events: number; cost: number; tokens: number }>;
}> {
  const totalResult = await queryOne<{ total_events: string; total_cost: string; total_tokens: string }>(
    `SELECT 
       COUNT(*) as total_events,
       COALESCE(SUM(estimated_cost), 0) as total_cost,
       COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
     FROM events WHERE organization_id = $1`,
    [orgId]
  );

  const modelResult = await queryMany<{ model: string; events: string; cost: string; tokens: string }>(
    `SELECT 
       model,
       COUNT(*) as events,
       COALESCE(SUM(estimated_cost), 0) as cost,
       COALESCE(SUM(input_tokens + output_tokens), 0) as tokens
     FROM events WHERE organization_id = $1
     GROUP BY model
     ORDER BY cost DESC`,
    [orgId]
  );

  const byModel: Record<string, { events: number; cost: number; tokens: number }> = {};
  for (const row of modelResult) {
    byModel[row.model] = {
      events: parseInt(row.events, 10),
      cost: parseFloat(row.cost),
      tokens: parseInt(row.tokens, 10)
    };
  }

  return {
    totalEvents: parseInt(totalResult?.total_events ?? '0', 10),
    totalCost: parseFloat(totalResult?.total_cost ?? '0'),
    totalTokens: parseInt(totalResult?.total_tokens ?? '0', 10),
    byModel
  };
}