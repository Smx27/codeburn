import type { Provider, SessionSource, SessionParser, ParsedProviderCall } from '../providers/oss-types.js';
import { getAdapter, discoverClaudeSessions, parseClaudeSession } from '../providers/index.js';
import { getSyncState, markSynced, getSourceStats, isSourceUnchanged } from '../state/syncState.repository.js';
import { BatchUploader } from '../uploader/batchUploader.js';
import type { SyncConfig, IncrementalSyncResult, SyncSession, SyncEvent } from '../types/sync.types.js';
import { 
  syncLogger, 
  createOperationLogger,
  logIncrementalSyncStart,
  logIncrementalSyncFinish,
  logProviderDetected,
  logSourceDiscovered,
  logChecksumCalculated,
  logSyncStateUpdated,
  logOperationError
} from '../logging/sync.logger.js';

export class IncrementalSyncService {
  private uploader: BatchUploader;
  private config: SyncConfig;
  private providers: Provider[];

  constructor(config: SyncConfig, providers: Provider[], uploader?: BatchUploader) {
    this.config = config;
    this.providers = providers;
    this.uploader = uploader ?? new BatchUploader(config);
  }

  async initialize(): Promise<void> {
    await this.uploader.initialize();
  }

  async runIncrementalSync(): Promise<IncrementalSyncResult> {
    const operationId = crypto.randomUUID();
    const logger = createOperationLogger({
      operationId,
      organizationId: this.config.organizationId,
      machineId: this.config.machineId,
      provider: 'all',
    });

    const result: IncrementalSyncResult = {
      sourcesChecked: 0,
      sourcesSynced: 0,
      eventsSynced: 0,
      errors: [],
    };

    logIncrementalSyncStart(logger);

    try {
      const providerFilter = ['claude', 'codex', 'cursor', 'gemini', 'warp', 'opencode'];
      const filteredProviders = this.providers.filter(p => providerFilter.includes(p.name));

      for (const provider of filteredProviders) {
        try {
          const providerResult = await this.syncProviderIncremental(provider, logger);
          result.sourcesChecked += providerResult.sourcesChecked;
          result.sourcesSynced += providerResult.sourcesSynced;
          result.eventsSynced += providerResult.eventsSynced;
        } catch (error) {
          const errorMsg = `Failed to incrementally sync ${provider.name}: ${(error as Error).message}`;
          logger.error({ provider: provider.name, error: (error as Error).message }, errorMsg);
          result.errors.push(errorMsg);
        }
      }

      logIncrementalSyncFinish(logger, result.sourcesSynced, result.eventsSynced);
      return result;
    } catch (error) {
      logOperationError(logger, 'incremental_sync', error as Error);
      throw error;
    }
  }

  private async syncProviderIncremental(
    provider: Provider,
    baseLogger: ReturnType<typeof createOperationLogger>
  ): Promise<{ sourcesChecked: number; sourcesSynced: number; eventsSynced: number }> {
    const adapter = getAdapter(provider.name);
    if (!adapter) {
      throw new Error(`No adapter for provider: ${provider.name}`);
    }

    const providerLogger = baseLogger.child({ provider: provider.name });

    const sources = await provider.discoverSessions();
    providerLogger.info({ event: 'provider_sessions_discovered', count: sources.length }, `Discovered ${sources.length} sources`);

    let sourcesChecked = 0;
    let sourcesSynced = 0;
    let eventsSynced = 0;

    for (const source of sources) {
      try {
        const sourceLogger = providerLogger.child({ sourcePath: source.path });
        logSourceDiscovered(sourceLogger, source.path, provider.name);

        sourcesChecked++;

        const state = await getSyncState(
          this.config.organizationId,
          this.config.machineId,
          provider.name,
          source.path
        );

        const stats = await getSourceStats(source.path);
        logChecksumCalculated(sourceLogger, source.path, stats.checksum);

        if (state && isSourceUnchanged(state, stats)) {
          sourceLogger.info({ event: 'source_unchanged' }, 'Source unchanged since last sync');
          continue;
        }

        const seenKeys = new Set<string>();
        let calls: ParsedProviderCall[] = [];

        // Use Claude-specific parsing if available
        if (provider.name === 'claude') {
          calls = await parseClaudeSession(source.path, source.project);
        } else {
          const parser = provider.createSessionParser(source, seenKeys);
          for await (const call of parser.parse()) {
            calls.push(call);
          }
        }

        if (calls.length === 0) {
          sourceLogger.info({ event: 'no_new_calls' }, 'Source parsed but yielded 0 events');
          await markSynced(
            this.config.organizationId,
            this.config.machineId,
            provider.name,
            source.path,
            stats.checksum
          );
          continue;
        }

        const newCalls = this.filterNewCalls(calls, state?.lastCallTimestamp);
        
        if (newCalls.length === 0) {
          sourceLogger.info({ event: 'no_new_calls_after_filter' }, 'All calls already synced, skipping');
          await markSynced(
            this.config.organizationId,
            this.config.machineId,
            provider.name,
            source.path,
            stats.checksum
          );
          continue;
        }

        const { sessions, events } = this.buildSyncPayload(newCalls, adapter);
        
        const batchSize = this.uploader['config'].batchSize;
        for (let i = 0; i < events.length; i += batchSize) {
          const batchEvents = events.slice(i, i + batchSize);
          const batchSessions = sessions.slice(i, i + batchSize);
          
          await this.uploader.uploadBatch({
            organizationId: this.config.organizationId,
            machineId: this.config.machineId,
            provider: provider.name,
            sessions: batchSessions,
            events: batchEvents,
          });
        }

        sourcesSynced++;
        eventsSynced += events.length;

        const lastTimestamp = newCalls[newCalls.length - 1]?.timestamp;
        await markSynced(
          this.config.organizationId,
          this.config.machineId,
          provider.name,
          source.path,
          stats.checksum,
          lastTimestamp
        );
        logSyncStateUpdated(sourceLogger, source.path, stats.checksum);

      } catch (error) {
        const errorMsg = `Failed to sync source ${source.path}: ${(error as Error).message}`;
        providerLogger.error({ sourcePath: source.path, error: (error as Error).message }, errorMsg);
      }
    }

    return { sourcesChecked, sourcesSynced, eventsSynced };
  }

  private filterNewCalls(calls: ParsedProviderCall[], lastCallTimestamp?: string): ParsedProviderCall[] {
    if (!lastCallTimestamp) return calls;
    return calls.filter(call => call.timestamp > lastCallTimestamp);
  }

  private buildSyncPayload(
    calls: ParsedProviderCall[],
    adapter: { adaptSession: (call: ParsedProviderCall) => SyncSession; adaptEvent: (call: ParsedProviderCall) => SyncEvent }
  ): { sessions: SyncSession[]; events: SyncEvent[] } {
    const sessionMap = new Map<string, SyncSession>();
    const events: SyncEvent[] = [];

    for (const call of calls) {
      if (!sessionMap.has(call.sessionId)) {
        sessionMap.set(call.sessionId, adapter.adaptSession(call));
      }
      events.push(adapter.adaptEvent(call));
    }

    return {
      sessions: Array.from(sessionMap.values()),
      events,
    };
  }

  async shutdown(): Promise<void> {
    await this.uploader.shutdown();
  }
}