import type { SyncConfig, HistoricalSyncResult, IncrementalSyncResult } from './types/sync.types.js';
import type { Provider } from './providers/oss-types.js';
import { SyncLoop } from './scheduler/syncLoop.js';
import { HistoricalSyncService } from './services/historicalSync.service.js';
import { IncrementalSyncService } from './services/incrementalSync.service.js';
import { BatchUploader } from './uploader/batchUploader.js';
import { IngestionClient } from './api-client/ingestion.client.js';
import { syncLogger } from './logging/sync.logger.js';

export interface SyncEngineOptions {
  organizationId: string;
  machineId: string;
  apiUrl: string;
  apiKey: string;
  batchSize?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  providers?: Provider[];
}

export class SyncEngine {
  private config: SyncConfig;
  private syncLoop: SyncLoop;
  private historicalSync: HistoricalSyncService;
  private incrementalSync: IncrementalSyncService;
  private uploader: BatchUploader;
  public client: IngestionClient;

  constructor(options: SyncEngineOptions) {
    this.config = {
      organizationId: options.organizationId,
      machineId: options.machineId,
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      batchSize: options.batchSize,
      maxRetries: options.maxRetries,
      baseDelayMs: options.baseDelayMs,
    };

    const providers = options.providers ?? [];
    
    this.syncLoop = new SyncLoop(this.config, providers);
    this.historicalSync = new HistoricalSyncService(this.config, providers);
    this.incrementalSync = new IncrementalSyncService(this.config, providers);
    this.uploader = new BatchUploader(this.config);
    this.client = new IngestionClient(this.config);
  }

  async initialize(): Promise<void> {
    await this.syncLoop.initialize();
    await this.historicalSync.initialize();
    await this.incrementalSync.initialize();
    await this.uploader.initialize();
  }

  async start(): Promise<void> {
    await this.syncLoop.start();
  }

  async runHistoricalSync(): Promise<HistoricalSyncResult> {
    return this.historicalSync.runFullHistoricalSync();
  }

  async runIncrementalSync(): Promise<IncrementalSyncResult> {
    return this.incrementalSync.runIncrementalSync();
  }

  async runOnce(): Promise<void> {
    await this.syncLoop.runOnce();
  }

  async shutdown(): Promise<void> {
    await this.syncLoop.shutdown();
  }

  isRunning(): boolean {
    return this.syncLoop.isRunning();
  }
}

export function createSyncEngine(options: SyncEngineOptions): SyncEngine {
  return new SyncEngine(options);
}

export { SyncLoop, HistoricalSyncService, IncrementalSyncService, BatchUploader, IngestionClient };
export * from './types/sync.types.js';
export * from './logging/sync.logger.js';