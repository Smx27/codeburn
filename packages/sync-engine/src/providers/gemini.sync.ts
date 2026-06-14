import type { ParsedProviderCall } from './oss-types.js';
import type { SyncSession, SyncEvent, ProviderAdapter } from '../types/sync.types.js';

export const geminiAdapter: ProviderAdapter = {
  name: 'gemini',
  
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
        reasoningTokens: call.reasoningTokens,
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

export function createGeminiAdapter(): ProviderAdapter {
  return geminiAdapter;
}