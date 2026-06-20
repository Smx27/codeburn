import { Request, Response } from 'express';
import { getProviderId } from '../repositories/provider.repository.js';
import { findOrganizationById } from '../repositories/organization.repository.js';
import { findOrCreateUser } from '../repositories/user.repository.js';
import { findOrCreateMachine } from '../repositories/machine.repository.js';
import { upsertSession } from '../repositories/session.repository.js';
import { insertEvents } from '../repositories/event.repository.js';
import { BatchUpload, SyncSession, SyncEvent } from '../validators/ingestion.validator.js';

export async function ingestBatch(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body as BatchUpload;

    // Use authenticated organization ID from middleware, not from request body
    const organizationId = req.ingestUser?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    // Validate organization exists by ID
    const org = await findOrganizationById(organizationId);
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    // Get or create user (using a default system user for now)
    const user = await findOrCreateUser(org.id, `machine-${payload.machineId}@system`, 'Sync Engine');
    
    // Get or create machine
    const machine = await findOrCreateMachine(org.id, user.id, payload.machineId);
    
    // Get provider ID
    let providerId: number;
    try {
      providerId = await getProviderId(payload.provider);
    } catch {
      res.status(400).json({ error: `Unknown provider: ${payload.provider}` });
      return;
    }

    // Process sessions
    const sessionMap = new Map<string, string>(); // externalSessionId -> internal session ID
    let sessionsInserted = 0;

    for (const session of payload.sessions) {
      const upserted = await upsertSession({
        organizationId: org.id,
        userId: user.id,
        machineId: machine.id,
        providerId,
        externalSessionId: session.externalSessionId,
        projectName: session.projectName,
        startedAt: new Date(session.startedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : undefined,
        rawMetadata: session.rawMetadata,
      });
      sessionMap.set(session.externalSessionId, upserted.id);
      sessionsInserted++;
    }

    // Process events
    const eventInputs = payload.events.map((event: SyncEvent) => ({
      organizationId: org.id,
      sessionId: sessionMap.get(event.sessionId) ?? event.sessionId,
      eventTime: new Date(event.eventTime),
      eventType: event.eventType,
      model: event.model,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      cacheReadTokens: event.cacheReadTokens,
      cacheWriteTokens: event.cacheWriteTokens,
      estimatedCost: event.estimatedCost,
      payload: event.payload,
      deduplicationKey: event.payload.deduplicationKey as string | undefined,
    }));

    const { inserted: eventsInserted, duplicates: duplicatesSkipped } = await insertEvents(eventInputs);

    res.json({
      sessionsInserted,
      eventsInserted,
      duplicatesSkipped,
    });
  } catch (error) {
    console.error('Batch ingestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function ingestSessions(req: Request, res: Response): Promise<void> {
  try {
    const { machineId, provider, sessions } = req.body as {
      machineId: string;
      provider: string;
      sessions: SyncSession[];
    };

    // Use authenticated organization ID from middleware
    const organizationId = req.ingestUser?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const org = await findOrganizationById(organizationId);
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    const user = await findOrCreateUser(org.id, `machine-${machineId}@system`, 'Sync Engine');
    const machine = await findOrCreateMachine(org.id, user.id, machineId);
    const providerId = await getProviderId(provider);

    let sessionsInserted = 0;
    for (const session of sessions) {
      await upsertSession({
        organizationId: org.id,
        userId: user.id,
        machineId: machine.id,
        providerId,
        externalSessionId: session.externalSessionId,
        projectName: session.projectName,
        startedAt: new Date(session.startedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : undefined,
        rawMetadata: session.rawMetadata,
      });
      sessionsInserted++;
    }

    res.json({ sessionsInserted });
  } catch (error) {
    console.error('Sessions ingestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function ingestEvents(req: Request, res: Response): Promise<void> {
  try {
    const { machineId, provider, events } = req.body as {
      machineId: string;
      provider: string;
      events: SyncEvent[];
    };

    // Use authenticated organization ID from middleware
    const organizationId = req.ingestUser?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const org = await findOrganizationById(organizationId);
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    const user = await findOrCreateUser(org.id, `machine-${machineId}@system`, 'Sync Engine');
    const machine = await findOrCreateMachine(org.id, user.id, machineId);
    const providerId = await getProviderId(provider);

    // For events-only, we need to ensure sessions exist
    // This is a simplified version - in practice you'd want to upsert sessions first
    const eventInputs = events.map((event) => ({
      organizationId: org.id,
      sessionId: event.sessionId,
      eventTime: new Date(event.eventTime),
      eventType: event.eventType,
      model: event.model,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      cacheReadTokens: event.cacheReadTokens,
      cacheWriteTokens: event.cacheWriteTokens,
      estimatedCost: event.estimatedCost,
      payload: event.payload,
      deduplicationKey: event.payload.deduplicationKey as string | undefined,
    }));

    const { inserted: eventsInserted, duplicates: duplicatesSkipped } = await insertEvents(eventInputs);

    res.json({ eventsInserted, duplicatesSkipped });
  } catch (error) {
    console.error('Events ingestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}