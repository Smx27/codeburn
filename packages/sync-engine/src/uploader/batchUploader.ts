import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { getUploadQueuePath } from '@aiinsight/platform';
import type { BatchUploadPayload, BatchUploadResponse, SyncConfig } from '../types/sync.types.js';
import { syncLogger, logBatchPrepared, logBatchUploaded, logBatchFailed, logRetryStarted, logRetryCompleted } from '../logging/sync.logger.js';

const QUEUE_DIR = getUploadQueuePath();

interface QueuedBatch {
  id: string;
  payload: BatchUploadPayload;
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
}

export class BatchUploader {
  private config: Required<SyncConfig>;
  private queue: QueuedBatch[] = [];
  private processing = false;

  constructor(config: SyncConfig) {
    this.config = {
      organizationId: config.organizationId,
      machineId: config.machineId,
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      batchSize: config.batchSize ?? 1000,
      maxRetries: config.maxRetries ?? 3,
      baseDelayMs: config.baseDelayMs ?? 1000,
    };
  }

  async initialize(): Promise<void> {
    await mkdir(QUEUE_DIR, { recursive: true });
    await this.loadQueue();
    this.processQueue();
  }

  async uploadBatch(payload: BatchUploadPayload): Promise<BatchUploadResponse> {
    const logger = syncLogger.child({ operation: 'upload_batch' });
    logBatchPrepared(logger, payload.sessions.length, payload.events.length);

    // Persist to queue first for durability
    const queuedBatch: QueuedBatch = {
      id: crypto.randomUUID(),
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    await this.persistBatch(queuedBatch);
    this.queue.push(queuedBatch);

    // Try immediate upload
    return this.uploadWithRetry(payload, logger);
  }

  private async uploadWithRetry(payload: BatchUploadPayload, logger: any): Promise<BatchUploadResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.doUpload(payload);
        logBatchUploaded(logger, response);
        return response;
      } catch (error) {
        lastError = error as Error;
        logBatchFailed(logger, lastError, attempt, this.config.maxRetries);
        
        if (attempt < this.config.maxRetries) {
          logRetryStarted(logger, attempt + 1, this.config.maxRetries);
          await this.delay(this.config.baseDelayMs * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError!;
  }

  private async doUpload(payload: BatchUploadPayload): Promise<BatchUploadResponse> {
    const response = await fetch(`${this.config.apiUrl}/api/v1/ingest/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<BatchUploadResponse>;
  }

  private async persistBatch(batch: QueuedBatch): Promise<void> {
    const filePath = join(QUEUE_DIR, `${batch.id}.json`);
    await writeFile(filePath, JSON.stringify(batch, null, 2), 'utf-8');
  }

  private async loadQueue(): Promise<void> {
    const { readdir } = await import('fs/promises');
    try {
      const files = await readdir(QUEUE_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await readFile(join(QUEUE_DIR, file), 'utf-8');
          this.queue.push(JSON.parse(content));
        }
      }
      syncLogger.info({ queuedBatches: this.queue.length }, 'Upload queue loaded');
    } catch {
      // Queue dir doesn't exist or is empty
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const logger = syncLogger.child({ operation: 'process_queue' });

    while (this.queue.length > 0) {
      const batch = this.queue[0];
      batch.attempts++;
      batch.lastAttemptAt = new Date().toISOString();
      await this.persistBatch(batch);

      try {
        await this.uploadWithRetry(batch.payload, logger);
        // Success - remove from queue
        this.queue.shift();
        await this.removeBatchFile(batch.id);
      } catch (error) {
        // Max retries reached, keep in queue for later
        logger.error({ batchId: batch.id, error: (error as Error).message }, 'Batch failed after max retries');
        break;
      }
    }

    this.processing = false;
  }

  private async removeBatchFile(batchId: string): Promise<void> {
    try {
      await unlink(join(QUEUE_DIR, `${batchId}.json`));
    } catch {
      // Ignore
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    // Wait for current upload to complete
    while (this.processing) {
      await this.delay(100);
    }
    syncLogger.info('Batch uploader shut down');
  }
}