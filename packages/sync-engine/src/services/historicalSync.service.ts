import type { Provider, SessionSource, SessionParser, ParsedProviderCall } from '../providers/oss-types.js';
import { getAdapter, discoverClaudeSessions, parseClaudeSession } from '../providers/index.js';
import { getSyncState, markSynced, getSourceStats, isSourceUnchanged } from '../state/syncState.repository.js';
import { BatchUploader } from '../uploader/batchUploader.js';
import type { SyncConfig, HistoricalSyncResult, SyncSession, SyncEvent } from '../types/sync.types.js';
import { 
  syncLogger, 
  createOperationLogger,
  logHistoricalSyncStart,
  logHistoricalSyncFinish,
  logProviderDetected,
  logSourceDiscovered,
  logChecksumCalculated,
  logSyncStateUpdated,
  logOperationError
} from '../logging/sync.logger.js';

export class HistoricalSyncService {
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

  async runFullHistoricalSync(): Promise<HistoricalSyncResult> {
    const operationId = crypto.randomUUID();
    const logger = createOperationLogger({
      operationId,
      organizationId: this.config.organizationId,
      machineId: this.config.machineId,
      provider: 'all',
    });

    const result: HistoricalSyncResult = {
      providersProcessed: 0,
      sessionsSynced: 0,
      eventsSynced: 0,
      errors: [],
    };

    try {
      const providerFilter = ['claude', 'codex', 'cursor', 'gemini', 'warp', 'opencode'];
      const filteredProviders = this.providers.filter(p => providerFilter.includes(p.name));

      for (const provider of filteredProviders) {
        try {
          const providerResult = await this.syncProviderHistorical(provider, logger);
          result.providersProcessed++;
          result.sessionsSynced += providerResult.sessionsSynced;
          result.eventsSynced += providerResult.eventsSynced;
        } catch (error) {
          const errorMsg = `Failed to sync ${provider.name}: ${(error as Error).message}`;
          logger.error({ provider: provider.name, error: (error as Error).message }, errorMsg);
          result.errors.push(errorMsg);
        }
      }

      return result;
    } catch (error) {
      logOperationError(logger, 'historical_sync', error as Error);
      throw error;
    }
  }

  private async syncProviderHistorical(
    provider: Provider,
    baseLogger: ReturnType<typeof createOperationLogger>
  ): Promise<{ sessionsSynced: number; eventsSynced: number }> {
    const adapter = getAdapter(provider.name);
    if (!adapter) {
      throw new Error(`No adapter for provider: ${provider.name}`);
    }

    const providerLogger = baseLogger.child({ provider: provider.name });
    logHistoricalSyncStart(providerLogger, provider.name);

    const sources = await provider.discoverSessions();
    logProviderDetected(providerLogger, provider.name, sources.length);

    let totalSessionsSynced = 0;
    let totalEventsSynced = 0;

    for (const source of sources) {
      try {
        const sourceLogger = providerLogger.child({ sourcePath: source.path });
        logSourceDiscovered(sourceLogger, source.path, provider.name);

        const state = await getSyncState(
          this.config.organizationId,
          this.config.machineId,
          provider.name,
          source.path
        );

        const stats = await getSourceStats(source.path);
        logChecksumCalculated(sourceLogger, source.path, stats.checksum);

        if (state && isSourceUnchanged(state, stats)) {
          sourceLogger.debug({ event: 'source_unchanged' }, 'Source already synced, skipping');
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
          sourceLogger.debug({ event: 'no_calls' }, 'No calls found in source');
          await markSynced(
            this.config.organizationId,
            this.config.machineId,
            provider.name,
            source.path,
            stats.checksum
          );
          continue;
        }

        const { sessions, events } = this.buildSyncPayload(calls, adapter);
        
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

        totalSessionsSynced += sessions.length;
        totalEventsSynced += events.length;

        await markSynced(
          this.config.organizationId,
          this.config.machineId,
          provider.name,
          source.path,
          stats.checksum
        );
        logSyncStateUpdated(sourceLogger, source.path, stats.checksum);

      } catch (error) {
        const errorMsg = `Failed to sync source ${source.path}: ${(error as Error).message}`;
        providerLogger.error({ sourcePath: source.path, error: (error as Error).message }, errorMsg);
      }
    }

    logHistoricalSyncFinish(providerLogger, provider.name, totalSessionsSynced, totalEventsSynced);
    return { sessionsSynced: totalSessionsSynced, eventsSynced: totalEventsSynced };
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