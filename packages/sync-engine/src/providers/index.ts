import type { ProviderAdapter } from '../types/sync.types.js';
import type { Provider } from './oss-types.js';
import { claudeAdapter } from './claude.sync.js';
import { codexAdapter } from './codex.sync.js';
import { cursorAdapter } from './cursor.sync.js';
import { geminiAdapter } from './gemini.sync.js';

const adapters = new Map<string, ProviderAdapter>([
  ['claude', claudeAdapter],
  ['codex', codexAdapter],
  ['cursor', cursorAdapter],
  ['gemini', geminiAdapter],
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

export { ProviderAdapter } from '../types/sync.types.js';