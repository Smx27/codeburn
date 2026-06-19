# Dashboard API Reference

Base URL: `http://localhost:3002/api/v1`

---

## Authentication

### POST /auth/register

Create a new account and organization.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "uuid",
    "role": "owner"
  }
}
```

### POST /auth/login

Authenticate and receive tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "uuid",
    "role": "owner"
  }
}
```

### POST /auth/refresh

Refresh access token.

**Request**:
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "g7h8i9j0k1l2..."
}
```

### POST /auth/logout

Delete all refresh tokens. Requires auth.

**Response** (200):
```json
{ "message": "Logged out" }
```

### POST /auth/verify-email

Verify email with token.

**Request**:
```json
{ "token": "abc123..." }
```

### POST /auth/resend-verification

Resend verification email.

**Request**:
```json
{ "email": "user@example.com" }
```

### POST /auth/forgot-password

Request password reset.

**Request**:
```json
{ "email": "user@example.com" }
```

### POST /auth/reset-password

Reset password with token.

**Request**:
```json
{
  "token": "abc123...",
  "newPassword": "newsecurepassword"
}
```

### POST /auth/change-password

Change password. Requires auth.

**Request**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## Dashboard Analytics

### GET /dashboard/overview

Get aggregated usage stats.

**Query Parameters**:
| Param | Type | Default | Values |
|-------|------|---------|--------|
| `period` | string | `7d` | `24h`, `7d`, `30d`, `90d`, `1y` |

**Response** (200):
```json
{
  "totalSessions": 1234,
  "totalUsers": 5,
  "totalTokens": 1234567,
  "totalCost": 45.67,
  "activeProviders": 3,
  "periodStart": "2026-06-12",
  "periodEnd": "2026-06-19"
}
```

### GET /dashboard/providers

Get per-provider analytics.

**Query Parameters**: `period` (same as overview)

**Response** (200):
```json
[
  {
    "providerId": 1,
    "providerName": "claude",
    "totalSessions": 500,
    "totalTokens": 500000,
    "totalCost": 20.00,
    "percentageOfTotal": 43.8
  }
]
```

### GET /dashboard/models

Get per-model analytics.

**Query Parameters**:
| Param | Type | Default |
|-------|------|---------|
| `period` | string | `7d` |
| `limit` | number | `20` |

**Response** (200):
```json
[
  {
    "model": "claude-sonnet-4-20250514",
    "totalTokens": 300000,
    "totalCost": 12.00,
    "sessionCount": 300,
    "percentageOfTotal": 26.3
  }
]
```

### GET /dashboard/users

Get per-user analytics.

**Query Parameters**: `period`, `limit`

**Response** (200):
```json
[
  {
    "userId": "uuid",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "sessionCount": 100,
    "tokenCount": 50000,
    "cost": 5.00
  }
]
```

### GET /dashboard/projects

Get per-project analytics.

**Query Parameters**: `period`, `limit`

**Response** (200):
```json
[
  {
    "projectName": "my-app",
    "sessionCount": 50,
    "tokenCount": 25000,
    "cost": 2.50
  }
]
```

### GET /dashboard/trends

Get time-series data.

**Query Parameters**:
| Param | Type | Default | Values |
|-------|------|---------|--------|
| `period` | string | `7d` | `24h`, `7d`, `30d`, `90d`, `1y` |
| `granularity` | string | `daily` | `daily`, `weekly`, `monthly` |

**Response** (200):
```json
{
  "granularity": "daily",
  "data": [
    {
      "date": "2026-06-19",
      "sessions": 50,
      "users": 3,
      "tokens": 25000,
      "cost": 2.50
    }
  ]
}
```

### POST /dashboard/backfill

Trigger historical backfill. Requires admin role.

**Response** (200):
```json
{ "message": "Backfill started", "result": { ... } }
```

### GET /dashboard/organization

Get organization overview with counts.

**Response** (200):
```json
{
  "id": "uuid",
  "name": "My Org",
  "created_at": "2026-01-01T00:00:00Z",
  "settings": { "timezone": "UTC", "currency": "USD", "retention_days": 90 },
  "counts": { "users": 5, "teams": 2, "machines": 3, "providers": 4, "sessions": 1000, "events": 5000 }
}
```

### GET /dashboard/agents

List all machines.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "hostname": "dev-machine",
    "os": "darwin",
    "architecture": "arm64",
    "agent_version": "0.9.12",
    "first_seen": "2026-01-01T00:00:00Z",
    "last_seen": "2026-06-19T12:00:00Z",
    "status": "ONLINE"
  }
]
```

### GET /dashboard/sync-jobs

List recent sync jobs.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "machine_id": "uuid",
    "provider": "claude",
    "started_at": "2026-06-19T12:00:00Z",
    "completed_at": "2026-06-19T12:01:00Z",
    "records_processed": 100,
    "status": "completed"
  }
]
```

### GET /dashboard/onboarding

Get onboarding progress.

**Response** (200):
```json
{
  "hasOrganization": true,
  "hasUsers": true,
  "hasTeams": true,
  "hasEnrollmentKeys": true,
  "hasMachines": true,
  "hasSessions": true
}
```

---

## Sessions

### GET /sessions

List sessions with filters.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Search project name |
| `provider` | string | — | Filter by provider |
| `startDate` | string | — | ISO date |
| `endDate` | string | — | ISO date |
| `sortBy` | string | `startedAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `page` | number | `1` | Page number |
| `pageSize` | number | `20` | Items per page |

**Response** (200):
```json
{
  "sessions": [
    {
      "id": "uuid",
      "providerName": "claude",
      "projectName": "my-app",
      "startedAt": "2026-06-19T12:00:00Z",
      "eventCount": 10,
      "totalTokens": 5000,
      "totalCost": 0.50
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /sessions/:id

Get session detail with events.

**Response** (200):
```json
{
  "session": {
    "id": "uuid",
    "providerName": "claude",
    "projectName": "my-app",
    "startedAt": "2026-06-19T12:00:00Z",
    "totalTokens": 5000,
    "totalCost": 0.50
  },
  "events": [
    {
      "id": 1,
      "eventTime": "2026-06-19T12:00:00Z",
      "eventType": "completion",
      "model": "claude-sonnet-4-20250514",
      "inputTokens": 1500,
      "outputTokens": 800,
      "cacheReadTokens": 0,
      "cacheWriteTokens": 0,
      "estimatedCost": 0.05
    }
  ]
}
```

---

## Machines

### GET /machines/:id

Get machine detail.

**Response** (200):
```json
{
  "machine": {
    "id": "uuid",
    "hostname": "dev-machine",
    "os": "darwin",
    "architecture": "arm64",
    "agent_version": "0.9.12",
    "status": "ONLINE",
    "first_seen": "2026-01-01T00:00:00Z",
    "last_seen": "2026-06-19T12:00:00Z"
  },
  "metrics": {
    "totalSessions": 100,
    "totalEvents": 500,
    "totalTokens": 50000,
    "totalCost": 5.00
  },
  "recentSessions": [...],
  "costByModel": [...],
  "costOverTime": [...],
  "agentTokens": [...]
}
```

---

## API Keys

### GET /api-keys

List API keys.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "name": "Sync Key",
    "prefix": "cb_abc12345",
    "role": "write",
    "created_at": "2026-06-19T12:00:00Z",
    "last_used_at": "2026-06-19T12:00:00Z",
    "expires_at": null
  }
]
```

### POST /api-keys

Create API key. Requires admin.

**Request**:
```json
{
  "name": "Sync Key",
  "role": "write",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Sync Key",
  "prefix": "cb_abc12345",
  "role": "write",
  "created_at": "2026-06-19T12:00:00Z",
  "key": "cb_abc12345_678901234567890123456789012345678901234567890123"
}
```

**Note**: The `key` is only shown once. Store it securely.

### DELETE /api-keys/:id

Revoke API key. Requires admin.

---

## Invitations

### POST /invitations/accept

Accept invitation. **Public endpoint** (no auth required).

**Request**:
```json
{ "token": "abc123..." }
```

### POST /invitations

Create invitation. Requires admin.

**Request**:
```json
{
  "email": "teammate@example.com",
  "role": "member"
}
```

### GET /invitations

List invitations.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "email": "teammate@example.com",
    "role": "member",
    "expires_at": "2026-06-26T12:00:00Z",
    "accepted_at": null,
    "created_at": "2026-06-19T12:00:00Z"
  }
]
```

### DELETE /invitations/:id

Revoke invitation. Requires admin.

### POST /invitations/:id/resend

Resend invitation email. Requires admin.

---

## Organizations

### POST /organizations

Create organization.

### GET /organizations/current

Get current organization.

### PATCH /organizations/current

Update organization. Requires admin.

---

## Teams

### GET /teams

List teams.

### POST /teams

Create team. Requires admin.

### PATCH /teams/:id

Update team. Requires admin.

### DELETE /teams/:id

Delete team. Requires admin.

### POST /teams/:id/members

Add team member. Requires admin.

### DELETE /teams/:id/members/:userId

Remove team member. Requires admin.

---

## Enrollment Keys

### GET /enrollment-keys

List enrollment keys.

### POST /enrollment-keys

Generate enrollment key. Requires admin.

### DELETE /enrollment-keys/:id

Revoke enrollment key. Requires admin.

### POST /enrollment-keys/:id/rotate

Rotate enrollment key. Requires admin.

---

## Agents

### POST /agents/register

Register agent. Requires enrollment key.

**Request**:
```json
{
  "hostname": "dev-machine",
  "os": "darwin",
  "architecture": "arm64",
  "agentVersion": "0.9.12"
}
```

### POST /agents/heartbeat

Agent heartbeat. Requires JWT.

### GET /agents/config

Get agent config. Requires auth.

### GET /agents

List agents. Requires auth.

### GET /agents/:id

Get agent detail. Requires auth.

---

## Health

### GET /health

Health check.

**Response** (200):
```json
{ "status": "ok", "timestamp": "2026-06-19T12:00:00Z" }
```

### GET /version

Version info.

**Response** (200):
```json
{ "version": "0.9.12", "name": "aiinsight-dashboard-api" }
```
