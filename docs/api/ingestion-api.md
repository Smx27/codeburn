# Ingestion API Reference

Base URL: `http://localhost:3001/api/v1`

---

## Authentication

All ingestion endpoints require authentication via:
- JWT Bearer token: `Authorization: Bearer <jwt>`
- API key: `Authorization: Bearer <ai_...>` or `X-API-Key: <ai_...>`

API key format: `ai_live_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`

---

## Rate Limiting

| Limit | Window | Key |
|-------|--------|-----|
| 1000 requests | 1 minute | API key or IP |

---

## Batch Upload

### POST /ingest/batch

Upload sessions and events in a single request.

**Request**:
```json
{
  "organizationId": "uuid",
  "machineId": "uuid",
  "provider": "claude",
  "sessions": [
    {
      "externalSessionId": "session-123",
      "projectName": "my-app",
      "startedAt": "2026-06-19T12:00:00Z"
    }
  ],
  "events": [
    {
      "sessionId": "session-123",
      "eventTime": "2026-06-19T12:00:00Z",
      "eventType": "completion",
      "model": "claude-sonnet-4-20250514",
      "inputTokens": 1500,
      "outputTokens": 800,
      "cacheReadTokens": 0,
      "cacheWriteTokens": 0,
      "estimatedCost": 0.05,
      "payload": {}
    }
  ]
}
```

**Validation**:
- `organizationId`: UUID, required
- `machineId`: UUID, required
- `provider`: string, min length 1
- `sessions[].externalSessionId`: string, required
- `sessions[].projectName`: string, optional
- `sessions[].startedAt`: ISO timestamp, required
- `events[].sessionId`: string, required
- `events[].eventTime`: ISO timestamp, required
- `events[].eventType`: string, required
- `events[].model`: string, required
- `events[].inputTokens`: number, required
- `events[].outputTokens`: number, required
- `events[].cacheReadTokens`: number, required
- `events[].cacheWriteTokens`: number, required
- `events[].estimatedCost`: number, required
- `events[].payload`: object, required

**Response** (200):
```json
{
  "sessionsInserted": 1,
  "eventsInserted": 10
}
```

**Errors**:

| Status | Error |
|--------|-------|
| 400 | Validation failed |
| 401 | Invalid API key |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Session Upload

### POST /ingest/sessions

Upload sessions only.

**Request**:
```json
{
  "organizationId": "uuid",
  "machineId": "uuid",
  "provider": "claude",
  "sessions": [
    {
      "externalSessionId": "session-123",
      "projectName": "my-app",
      "startedAt": "2026-06-19T12:00:00Z"
    }
  ]
}
```

---

## Event Upload

### POST /ingest/events

Upload events only.

**Request**:
```json
{
  "organizationId": "uuid",
  "machineId": "uuid",
  "provider": "claude",
  "events": [
    {
      "sessionId": "session-123",
      "eventTime": "2026-06-19T12:00:00Z",
      "eventType": "completion",
      "model": "claude-sonnet-4-20250514",
      "inputTokens": 1500,
      "outputTokens": 800,
      "cacheReadTokens": 0,
      "cacheWriteTokens": 0,
      "estimatedCost": 0.05,
      "payload": {}
    }
  ]
}
```

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
{ "version": "0.9.12", "name": "aiinsight-ingestion-api" }
```

---

## OpenAPI

### GET /api/openapi.json

Returns the OpenAPI specification.

### GET /api/docs

Returns the Swagger UI.
