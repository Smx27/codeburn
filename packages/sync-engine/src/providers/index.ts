import type { ProviderAdapter } from '../types/sync.types.js';
import type { Provider } from './oss-types.js';
import { claudeAdapter, discoverClaudeSessions, parseClaudeSession } from './claude.sync.js';
import { codexAdapter } from './codex.sync.js';
import { cursorAdapter } from './cursor.sync.js';
import { geminiAdapter } from './gemini.sync.js';
import { warpAdapter } from './warp.sync.js';
import { opencodeAdapter } from './opencode.sync.js';

const adapters = new Map<string, ProviderAdapter>([
  ['claude', claudeAdapter],
  ['codex', codexAdapter],
  ['cursor', cursorAdapter],
  ['gemini', geminiAdapter],
  ['warp', warpAdapter],
  ['opencode', opencodeAdapter],
]);

export function getAdapter(provider: string): ProviderAdapter | undefined {
  return adapters.get(provider);
}

export function getAllAdapters(): ProviderAdapter[] {
  return Array.from(adapters.values());
}

export function registerAdapter(adapter: ProviderAdapter): void {
  adapters.set(adapter.name, adapter);
}

// Export Claude discovery and parsing for sync engine use
export { discoverClaudeSessions, parseClaudeSession };

export { ProviderAdapter } from '../types/sync.types.js';