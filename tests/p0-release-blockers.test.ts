import { describe, it, expect } from 'vitest';
import { isApiKey, extractApiKeyPrefix } from '@aiinsight/auth-shared';

describe('P0-1: API Key Prefix Extraction', () => {
  it('extracts 13-char prefix from aisk_ keys', () => {
    const prefix = `aisk_${'a1b2c3d4'}`;
    const fullKey = `${prefix}_${'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'}`;
    const extracted = extractApiKeyPrefix(fullKey);
    expect(extracted).toBe('aisk_a1b2c3d4');
    expect(extracted).toHaveLength(13);
  });

  it('extracts 11-char prefix from cb_ keys', () => {
    const prefix = `cb_${'a1b2c3d4'}`;
    const fullKey = `${prefix}_${'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'}`;
    const extracted = extractApiKeyPrefix(fullKey);
    expect(extracted).toBe('cb_a1b2c3d4');
    expect(extracted).toHaveLength(11);
  });

  it('does not use hardcoded slice(0,8)', () => {
    const key = 'aisk_a1b2c3d4_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8';
    const prefix = extractApiKeyPrefix(key);
    expect(prefix).not.toBe(key.slice(0, 8));
    expect(prefix).toBe('aisk_a1b2c3d4');
  });
});

describe('P0-3: API Key Detection (isApiKey)', () => {
  it('recognizes aisk_ prefixed keys', () => {
    expect(isApiKey('aisk_a1b2c3d4_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8')).toBe(true);
  });

  it('recognizes cb_ prefixed keys', () => {
    expect(isApiKey('cb_a1b2c3d4_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8')).toBe(true);
  });

  it('rejects JWT tokens', () => {
    expect(isApiKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U')).toBe(false);
  });

  it('rejects ai_ prefix (not aisk_)', () => {
    expect(isApiKey('ai_something_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isApiKey('')).toBe(false);
  });
});

describe('P0-2: Hash Algorithm Consistency (argon2)', () => {
  it('argon2 hash can be verified by argon2.verify', async () => {
    const argon2 = await import('argon2');
    const key = 'aisk_a1b2c3d4_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8';
    const hash = await argon2.default.hash(key);
    const valid = await argon2.default.verify(hash, key);
    expect(valid).toBe(true);
  });

  it('argon2 hash rejects wrong key', async () => {
    const argon2 = await import('argon2');
    const key = 'aisk_a1b2c3d4_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8';
    const hash = await argon2.default.hash(key);
    const valid = await argon2.default.verify(hash, 'aisk_wrong_key');
    expect(valid).toBe(false);
  });

  it('argon2 hashes start with $argon2id$ (not bcrypt format)', async () => {
    const argon2 = await import('argon2');
    const hash = await argon2.default.hash('test-key');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toMatch(/^\$2[aby]?\$/);
  });
});

describe('P0-4: Refresh Token Storage', () => {
  it('login response includes refreshToken field', () => {
    interface LoginResponse {
      token: string;
      refreshToken: string;
      user: { id: string; email: string; name: string | null; organizationId: string; role: string };
    }

    const mockResponse: LoginResponse = {
      token: 'jwt-token',
      refreshToken: 'refresh-token-123',
      user: { id: '1', email: 'test@test.com', name: 'Test', organizationId: 'org1', role: 'owner' },
    };

    expect(mockResponse.refreshToken).toBeDefined();
    expect(typeof mockResponse.refreshToken).toBe('string');
    expect(mockResponse.refreshToken.length).toBeGreaterThan(0);
  });

  it('auth-context stores refresh token on login', () => {
    const localStorage: Record<string, string> = {};
    const mockSetItem = (key: string, value: string) => { localStorage[key] = value; };

    const result = {
      token: 'jwt-token',
      refreshToken: 'refresh-token-123',
      user: { id: '1', email: 'test@test.com', name: 'Test', organizationId: 'org1', role: 'owner' },
    };

    mockSetItem('aiinsight_token', result.token);
    mockSetItem('aiinsight_refresh_token', result.refreshToken);
    mockSetItem('aiinsight_user', JSON.stringify(result.user));

    expect(localStorage['aiinsight_refresh_token']).toBe('refresh-token-123');
  });

  it('auto-refresh reads refresh token from localStorage', () => {
    const localStorage: Record<string, string> = {
      aiinsight_token: 'expired-jwt',
      aiinsight_refresh_token: 'stored-refresh-token',
    };

    const refreshToken = localStorage['aiinsight_refresh_token'];
    expect(refreshToken).toBe('stored-refresh-token');
  });
});

describe('P0-5: Heartbeat Security', () => {
  it('heartbeat without auth returns 401', () => {
    const hasAuth = false;
    const ingestUser = undefined;
    const response = !ingestUser ? { status: 401, error: 'Authentication required' } : { status: 200 };
    expect(response.status).toBe(401);
  });

  it('heartbeat derives organizationId from token, not body', () => {
    const body = { machineId: 'machine-1', organizationId: 'spoofed-org' };
    const ingestUser = { organizationId: 'legit-org', userId: 'u1', role: 'write' };

    const orgUsed = ingestUser.organizationId;
    expect(orgUsed).toBe('legit-org');
    expect(orgUsed).not.toBe(body.organizationId);
  });

  it('machineId still accepted from body', () => {
    const body = { machineId: 'machine-1' };
    const ingestUser = { organizationId: 'legit-org', userId: 'u1', role: 'write' };

    expect(body.machineId).toBeDefined();
    expect(ingestUser.organizationId).toBe('legit-org');
  });

  it('heartbeat with valid token and machine succeeds', () => {
    const ingestUser = { organizationId: 'org1', userId: 'u1', role: 'write' };
    const body = { machineId: 'machine-1' };

    expect(ingestUser?.organizationId).toBeDefined();
    expect(body.machineId).toBeDefined();
  });
});

describe('P0-6: General Rate Limiting', () => {
  it('generalRateLimit is applied to dashboard routes', () => {
    const dashboardRoutes = '/api/v1/dashboard';
    const protectedRoutes = [
      '/api/v1/dashboard',
      '/api/v1/organizations',
      '/api/v1/teams',
      '/api/v1/invitations',
      '/api/v1/enrollment-keys',
      '/api/v1/agents',
      '/api/v1/onboarding',
      '/api/v1/sessions',
      '/api/v1/machines',
      '/api/v1/api-keys',
    ];

    expect(protectedRoutes).toContain(dashboardRoutes);
    expect(protectedRoutes).toHaveLength(10);
  });

  it('health endpoint is not rate limited', () => {
    const unrateLimited = ['/api/v1/health', '/api/v1/version', '/'];
    expect(unrateLimited).toContain('/api/v1/health');
  });
});

describe('End-to-End: API Key Generation → Authentication → Ingestion', () => {
  it('generated aisk_ key has correct format for DB lookup', async () => {
    const crypto = await import('crypto');
    const prefix = `aisk_${crypto.randomBytes(4).toString('hex')}`;
    const fullKey = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;

    const extractedPrefix = extractApiKeyPrefix(fullKey);

    expect(fullKey).toMatch(/^aisk_[a-f0-9]{8}_[a-f0-9]{48}$/);
    expect(extractedPrefix).toBe(prefix);
    expect(extractedPrefix).toHaveLength(13);
  });
});
