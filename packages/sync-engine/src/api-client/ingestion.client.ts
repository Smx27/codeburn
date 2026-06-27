import type { SyncConfig, BatchUploadPayload, BatchUploadResponse } from '../types/sync.types.js';

export class IngestionClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: SyncConfig) {
    this.baseUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async uploadBatch(payload: BatchUploadPayload): Promise<BatchUploadResponse> {
    const url = `${this.baseUrl}/api/v1/ingest/batch`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} from ${url}: ${errorText}`);
      }

      return response.json() as Promise<BatchUploadResponse>;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        const cause = (error as any).cause?.message || '';
        throw new Error(`Cannot reach ${url}${cause ? `: ${cause}` : ''}`);
      }
      throw error;
    }
  }

  async uploadSessions(organizationId: string, machineId: string, provider: string, sessions: any[]): Promise<void> {
    const url = `${this.baseUrl}/api/v1/ingest/sessions`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ organizationId, machineId, provider, sessions }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} from ${url}: ${errorText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        const cause = (error as any).cause?.message || '';
        throw new Error(`Cannot reach ${url}${cause ? `: ${cause}` : ''}`);
      }
      throw error;
    }
  }

  async uploadEvents(organizationId: string, machineId: string, provider: string, events: any[]): Promise<void> {
    const url = `${this.baseUrl}/api/v1/ingest/events`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ organizationId, machineId, provider, events }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} from ${url}: ${errorText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'fetch failed') {
        const cause = (error as any).cause?.message || '';
        throw new Error(`Cannot reach ${url}${cause ? `: ${cause}` : ''}`);
      }
      throw error;
    }
  }
}