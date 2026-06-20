import type { SyncConfig } from '../types/sync.types.js';
import type { Provider } from '../providers/oss-types.js';
import { HistoricalSyncService } from '../services/historicalSync.service.js';
import { IncrementalSyncService } from '../services/incrementalSync.service.js';
import { syncLogger, createOperationLogger } from '../logging/sync.logger.js';

export class SyncLoop {
  private historicalSync: HistoricalSyncService;
  private incrementalSync: IncrementalSyncService;
  private config: SyncConfig;
  private intervalMs: number;
  private heartbeatIntervalMs: number;
  private historicalCompleted = false;
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;
  private heartbeatId: NodeJS.Timeout | null = null;

  constructor(config: SyncConfig, providers: Provider[]) {
    this.config = config;
    this.intervalMs = 5 * 60 * 1000;
    this.heartbeatIntervalMs = 60 * 1000; // 1 minute
    this.historicalSync = new HistoricalSyncService(config, providers);
    this.incrementalSync = new IncrementalSyncService(config, providers);
  }

  async initialize(): Promise<void> {
    await this.historicalSync.initialize();
    await this.incrementalSync.initialize();
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const url = `${this.config.apiUrl}/heartbeat`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: this.config.machineId,
          organizationId: this.config.organizationId,
        }),
      });
    } catch {
      // Silent — heartbeat failures are non-critical
    }
  }

  async start(): Promise<void> {
    if (this.running) {
      syncLogger.warn('Sync loop already running');
      return;
    }

    this.running = true;
    const operationId = crypto.randomUUID();
    const logger = createOperationLogger({
      operationId,
      organizationId: this.config.organizationId,
      machineId: this.config.machineId,
      provider: 'all',
    });

    logger.info({ intervalMs: this.intervalMs }, 'Starting sync loop');

    try {
      if (!this.historicalCompleted) {
        logger.info('Running historical sync...');
        const result = await this.historicalSync.runFullHistoricalSync();
        logger.info(result, 'Historical sync completed');
        this.historicalCompleted = true;
      }

      logger.info('Running initial incremental sync...');
      await this.incrementalSync.runIncrementalSync();

      // Send initial heartbeat
      await this.sendHeartbeat();

      this.intervalId = setInterval(async () => {
        if (!this.running) return;
        
        try {
          await this.incrementalSync.runIncrementalSync();
        } catch (error) {
          logger.error({ error: (error as Error).message }, 'Incremental sync failed');
        }
      }, this.intervalMs);

      this.heartbeatId = setInterval(async () => {
        if (!this.running) return;
        await this.sendHeartbeat();
      }, this.heartbeatIntervalMs);

      logger.info('Sync loop started successfully');
    } catch (error) {
      this.running = false;
      logger.error({ error: (error as Error).message }, 'Failed to start sync loop');
      throw error;
    }
  }

  async runOnce(): Promise<void> {
    const operationId = crypto.randomUUID();
    const logger = createOperationLogger({
      operationId,
      organizationId: this.config.organizationId,
      machineId: this.config.machineId,
      provider: 'all',
    });

    logger.info('Running one-time sync...');

    if (!this.historicalCompleted) {
      await this.historicalSync.runFullHistoricalSync();
      this.historicalCompleted = true;
    }

    await this.incrementalSync.runIncrementalSync();
    await this.sendHeartbeat();
    logger.info('One-time sync completed');
  }

  async shutdown(): Promise<void> {
    this.running = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.heartbeatId) {
      clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }

    await this.historicalSync.shutdown();
    await this.incrementalSync.shutdown();

    syncLogger.info('Sync loop shut down');
  }

  isRunning(): boolean {
    return this.running;
  }

  isHistoricalCompleted(): boolean {
    return this.historicalCompleted;
  }
}