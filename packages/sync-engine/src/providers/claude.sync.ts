import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { ParsedProviderCall } from './oss-types.js';
import type { SyncSession, SyncEvent, ProviderAdapter } from '../types/sync.types.js';

// Minimal JSONL parser for Claude sessions - extracts what sync needs
interface JournalEntry {
  type: string;
  timestamp?: string;
  sessionId?: string;
  message?: {
    id?: string;
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    content?: Array<{ type: string; name?: string; text?: string }>;
  };
  uuid?: string;
  parentMessageId?: string;
}

function getMessageId(entry: JournalEntry): string | undefined {
  return entry.message?.id ?? entry.uuid;
}

function getClaudeConfigDirs(): string[] {
  const multi = process.env['CLAUDE_CONFIG_DIRS'];
  if (multi !== undefined && multi !== '') {
    return multi.split(':').map(s => s.trim()).filter(s => s.length > 0);
  }
  const single = process.env['CLAUDE_CONFIG_DIR'];
  if (single !== undefined && single !== '') return [single];
  return [join(homedir(), '.claude')];
}

async function readJsonlFile(filePath: string): Promise<JournalEntry[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const entries: JournalEntry[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip invalid JSON lines
      }
    }
    return entries;
  } catch {
    return [];
  }
}

function parseEntriesToCalls(
  entries: JournalEntry[],
  projectName: string,
  sourcePath: string
): ParsedProviderCall[] {
  const calls: ParsedProviderCall[] = [];
  const seenMsgIds = new Set<string>();

  // Group entries into turns (user message + assistant responses)
  let currentUserMessage = '';
  let currentSessionId = '';
  let currentTimestamp = '';

  for (const entry of entries) {
    if (entry.type === 'user') {
      // Extract user message text
      const text = entry.message?.content
        ?.filter(b => b.type === 'text')
        .map(b => b.text || '')
        .join('') || '';
      if (text.trim()) {
        currentUserMessage = text.slice(0, 200); // Truncate for sync
        currentTimestamp = entry.timestamp || '';
        currentSessionId = entry.sessionId || '';
      }
    } else if (entry.type === 'assistant') {
      const msgId = getMessageId(entry);
      if (msgId && seenMsgIds.has(msgId)) continue;
      if (msgId) seenMsgIds.add(msgId);

      const msg = entry.message;
      if (!msg) continue;

      const model = msg.model || 'unknown';
      const usage = msg.usage || {};
      const inputTokens = usage.input_tokens || 0;
      const outputTokens = usage.output_tokens || 0;
      const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
      const cacheReadTokens = usage.cache_read_input_tokens || 0;

      // Extract tool names
      const tools = msg.content
        ?.filter(b => b.type === 'tool_use')
        .map(b => b.name || 'unknown')
        .filter(Boolean) || [];

      // Simple cost estimation (very approximate for sync)
      const costUSD = 0; // Let the server calculate costs

      calls.push({
        provider: 'claude',
        model,
        inputTokens,
        outputTokens,
        cacheCreationInputTokens: cacheCreationTokens,
        cacheReadInputTokens: cacheReadTokens,
        cachedInputTokens: 0,
        reasoningTokens: 0,
        webSearchRequests: 0,
        costUSD,
        tools,
        bashCommands: [],
        timestamp: entry.timestamp || currentTimestamp,
        speed: 'standard',
        deduplicationKey: msgId || `claude:${entry.timestamp}`,
        userMessage: currentUserMessage,
        sessionId: currentSessionId || `session-${sourcePath}`,
        project: projectName,
        projectPath: sourcePath,
      });
    }
  }

  return calls;
}

export async function discoverClaudeSessions(): Promise<Array<{ path: string; project: string; provider: string }>> {
  const sources: Array<{ path: string; project: string; provider: string }> = [];
  const configDirs = getClaudeConfigDirs();

  for (const configDir of configDirs) {
    const resolvedDir = resolve(configDir.replace(/^~/, homedir()));
    try {
      const projectsDir = join(resolvedDir, 'projects');
      const entries = await readdir(projectsDir).catch(() => []);

      for (const entry of entries) {
        const projectDir = join(projectsDir, entry);
        try {
          const statResult = await stat(projectDir);
          if (statResult.isDirectory()) {
            // Check for JSONL files in this project directory
            const files = await readdir(projectDir);
            const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
            if (jsonlFiles.length > 0) {
              sources.push({
                path: projectDir,
                project: entry,
                provider: 'claude',
              });
            }
          }
        } catch {
          // Skip unreadable directories
        }
      }
    } catch {
      // Skip unreadable config dirs
    }
  }

  return sources;
}

export async function parseClaudeSession(
  sourcePath: string,
  projectName: string
): Promise<ParsedProviderCall[]> {
  const allCalls: ParsedProviderCall[] = [];

  try {
    const files = await readdir(sourcePath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = join(sourcePath, file);
      const entries = await readJsonlFile(filePath);
      const calls = parseEntriesToCalls(entries, projectName, filePath);
      allCalls.push(...calls);
    }
  } catch {
    // Return empty on error
  }

  return allCalls;
}

// Sync adapter
export const claudeAdapter: ProviderAdapter = {
  name: 'claude',

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

export function createClaudeAdapter(): ProviderAdapter {
  return claudeAdapter;
}
