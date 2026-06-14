import type { ParsedProviderCall } from './oss-types.js';
import type { SyncSession, SyncEvent, ProviderAdapter } from '../types/sync.types.js';

export const cursorAdapter: ProviderAdapter = {
  name: 'cursor',
  
  adaptSession(call: ParsedProviderCall): SyncSession {
    return {
      externalSessionId: call.sessionId,
      projectName: call.project || 'unknown',
      startedAt: call.timestamp,
      endedAt: undefined,
      rawMetadata: {
        provider: call.provider,
        model: call.model,
        tools: call.tools,
      },
    };
  },

  adaptEvent(call: ParsedProviderCall): SyncEvent {
    return {
      sessionId: call.sessionId,
      eventTime: call.timestamp,
      eventType: 'completion',
      model: call.model,
      inputTokens: call.inputTokens,
      outputTokens: call.outputTokens,
      cacheReadTokens: call.cacheReadInputTokens,
      cacheWriteTokens: call.cacheCreationInputTokens,
      estimatedCost: call.costUSD,
      payload: call,
    };
  },
};

export function createCursorAdapter(): ProviderAdapter {
  return cursorAdapter;
}