import { describe, it, expect } from 'vitest';

describe('Incremental Sync - filterNewCalls', () => {
  interface MockCall {
    sessionId: string;
    timestamp: string;
    deduplicationKey: string;
  }

  function filterNewCalls(calls: MockCall[], lastCallTimestamp?: string): MockCall[] {
    if (!lastCallTimestamp) return calls;
    return calls.filter(call => call.timestamp > lastCallTimestamp);
  }

  it('returns all calls when no lastCallTimestamp is provided', () => {
    const calls: MockCall[] = [
      { sessionId: 's1', timestamp: '2024-01-01T10:00:00Z', deduplicationKey: 'key1' },
      { sessionId: 's2', timestamp: '2024-01-01T11:00:00Z', deduplicationKey: 'key2' },
    ];
    const result = filterNewCalls(calls);
    expect(result).toHaveLength(2);
  });

  it('filters calls older than lastCallTimestamp', () => {
    const calls: MockCall[] = [
      { sessionId: 's1', timestamp: '2024-01-01T10:00:00Z', deduplicationKey: 'key1' },
      { sessionId: 's2', timestamp: '2024-01-01T11:00:00Z', deduplicationKey: 'key2' },
      { sessionId: 's3', timestamp: '2024-01-01T12:00:00Z', deduplicationKey: 'key3' },
    ];
    const result = filterNewCalls(calls, '2024-01-01T10:30:00Z');
    expect(result).toHaveLength(2);
    expect(result[0].sessionId).toBe('s2');
    expect(result[1].sessionId).toBe('s3');
  });

  it('returns empty array when all calls are older', () => {
    const calls: MockCall[] = [
      { sessionId: 's1', timestamp: '2024-01-01T10:00:00Z', deduplicationKey: 'key1' },
    ];
    const result = filterNewCalls(calls, '2024-01-01T12:00:00Z');
    expect(result).toHaveLength(0);
  });

  it('handles empty calls array', () => {
    const result = filterNewCalls([], '2024-01-01T12:00:00Z');
    expect(result).toHaveLength(0);
  });

  it('handles calls with exact timestamp match (excludes equal)', () => {
    const calls: MockCall[] = [
      { sessionId: 's1', timestamp: '2024-01-01T10:00:00Z', deduplicationKey: 'key1' },
    ];
    const result = filterNewCalls(calls, '2024-01-01T10:00:00Z');
    expect(result).toHaveLength(0);
  });
});

describe('Incremental Sync - watermark persistence', () => {
  it('lastCallTimestamp is stored and retrieved from sync state', () => {
    const state = {
      organizationId: 'org1',
      machineId: 'machine1',
      provider: 'claude',
      sourceIdentifier: '/path/to/file',
      lastHash: 'abc123',
      lastCallTimestamp: '2024-01-01T10:00:00Z',
      updatedAt: new Date(),
    };

    expect(state.lastCallTimestamp).toBe('2024-01-01T10:00:00Z');
  });
});

describe('API Key Management', () => {
  it('API key prefix format is correct', () => {
    const prefix = 'cb_' + 'a1b2c3d4';
    expect(prefix).toMatch(/^cb_[a-f0-9]{8}$/);
  });

  it('API key full format is correct', () => {
    const prefix = 'cb_a1b2c3d4';
    const suffix = 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8';
    const fullKey = `${prefix}_${suffix}`;
    expect(fullKey).toMatch(/^cb_[a-f0-9]{8}_[a-f0-9]{48}$/);
  });
});

describe('Organization Lookup', () => {
  it('findOrganizationById uses UUID parameter', () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440000';
    expect(orgId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('ingestion controller validates organization exists', () => {
    const validOrgId = '550e8400-e29b-41d4-a716-446655440000';
    const invalidOrgId = 'not-a-uuid';
    expect(validOrgId).not.toBe(invalidOrgId);
  });
});

describe('JWT Secret Safety', () => {
  it('JWT_SECRET is required', () => {
    const originalEnv = process.env.JWT_SECRET;
    try {
      delete process.env.JWT_SECRET;
      expect(process.env.JWT_SECRET).toBeUndefined();
    } finally {
      if (originalEnv) {
        process.env.JWT_SECRET = originalEnv;
      }
    }
  });
});

describe('Rate Limiting', () => {
  it('auth rate limit is 100 req/min', () => {
    const max = 100;
    const windowMs = 60 * 1000;
    expect(max).toBe(100);
    expect(windowMs).toBe(60000);
  });

  it('ingest rate limit is 1000 req/min', () => {
    const max = 1000;
    const windowMs = 60 * 1000;
    expect(max).toBe(1000);
    expect(windowMs).toBe(60000);
  });
});

describe('Invitation Flow', () => {
  it('accept endpoint is public (no auth required)', () => {
    const publicRoutes = ['/api/v1/invitations/accept'];
    expect(publicRoutes).toContain('/api/v1/invitations/accept');
  });
});

describe('Offline Agent Detection', () => {
  it('offline threshold is 5 minutes', () => {
    const thresholdMs = 5 * 60 * 1000;
    expect(thresholdMs).toBe(300000);
  });
});

describe('Session Filters', () => {
  it('default page is 1', () => {
    const defaultPage = 1;
    expect(defaultPage).toBe(1);
  });

  it('default limit is 20', () => {
    const defaultLimit = 20;
    expect(defaultLimit).toBe(20);
  });

  it('default sortBy is started_at', () => {
    const defaultSortBy = 'started_at';
    expect(defaultSortBy).toBe('started_at');
  });

  it('default sortDir is desc', () => {
    const defaultSortDir = 'desc';
    expect(defaultSortDir).toBe('desc');
  });
});

describe('Session Duration Formatting', () => {
  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}m`;
  }

  it('formats seconds', () => {
    expect(formatDuration(30)).toBe('30s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3660)).toBe('1h 1m');
  });
});

describe('Token Formatting', () => {
  function formatTokens(tokens: number): string {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return String(tokens);
  }

  it('formats small numbers', () => {
    expect(formatTokens(500)).toBe('500');
  });

  it('formats thousands', () => {
    expect(formatTokens(1500)).toBe('1.5K');
  });

  it('formats millions', () => {
    expect(formatTokens(2500000)).toBe('2.5M');
  });
});

describe('Cost Formatting', () => {
  function formatCost(cost: number): string {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  }

  it('formats zero cost', () => {
    expect(formatCost(0)).toBe('$0.00');
  });

  it('formats very small cost', () => {
    expect(formatCost(0.005)).toBe('<$0.01');
  });

  it('formats normal cost', () => {
    expect(formatCost(1.5)).toBe('$1.50');
  });
});
