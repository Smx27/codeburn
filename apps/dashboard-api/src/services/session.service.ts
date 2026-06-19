import * as sessionRepo from '../repositories/session.repository.js';
import type { SessionListFilters, SessionListResponse, SessionDetail, SessionEvent } from '../types/session.types.js';

export async function listSessions(
  orgId: string,
  filters: SessionListFilters
): Promise<SessionListResponse> {
  const { sessions, total } = await sessionRepo.getSessionsWithFilters(orgId, filters);

  return {
    sessions,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getSessionDetail(
  orgId: string,
  sessionId: string
): Promise<SessionDetail | null> {
  const result = await sessionRepo.getSessionById(orgId, sessionId);
  if (!result || !result.session) return null;

  const { session, aggregates } = result;
  const events = await sessionRepo.getSessionEvents(orgId, sessionId);

  return {
    id: session.id,
    provider: session.provider,
    projectName: session.projectName,
    user: { id: session.userId, name: session.user_name, email: session.user_email },
    machine: { id: session.machineId, hostname: session.machine_name },
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds,
    totalInputTokens: aggregates.totalInputTokens,
    totalOutputTokens: aggregates.totalOutputTokens,
    totalTokens: aggregates.totalInputTokens + aggregates.totalOutputTokens,
    estimatedCost: aggregates.estimatedCost,
    eventCount: aggregates.eventCount,
    events,
  };
}
