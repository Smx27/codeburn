# Phase 01: Cloud Foundation

## 1. Executive Summary

### What Was Built

AiInsight Cloud Foundation introduces two new packages that enable cloud-based synchronization of AI coding usage data:

1. **`@aiinsight/sync-engine`** - A client-side synchronization library that discovers, parses, and uploads provider session data to the cloud ingestion API
2. **`@aiinsight/ingestion-api`** - A multi-tenant REST API service that receives, validates, deduplicates, and stores usage events in PostgreSQL

### Why It Was Built

AiInsight's CLI currently stores all usage data locally in SQLite databases and JSONL files. This limits:
- **Team collaboration** - No shared visibility into team-wide AI coding costs
- **Centralized reporting** - Cannot aggregate usage across multiple machines/developers
- **Enterprise adoption** - Organizations need audit trails and cost allocation
- **Historical analysis** - Local data is lost if machines are replaced or wiped

### Business Objective

Enable AiInsight Cloud as a SaaS offering where teams can:
- Aggregate AI coding usage across all team members and machines
- View real-time cost dashboards with provider/model breakdowns
- Export usage data for billing and chargeback
- Maintain audit trails for compliance

### Technical Objective

Build a foundation that:
- Reuses existing OSS provider parsers (no duplicate parsing logic)
- Supports multi-tenant isolation from day one
- Scales horizontally with stateless API servers
- Provides durability guarantees via local queue persistence

### Problems Solved

1. **Data Silos** - Usage data locked on individual developer machines
2. **No Team Visibility** - Cannot see aggregate team costs
3. **Compliance Gaps** - No audit trail for AI tool spending
4. **Backup Risk** - Local data loss = permanent history loss

---

## 2. Scope of This Phase

### Included

| Feature | Status |
|---------|--------|
| Sync Engine core (historical + incremental sync) | ✅ Complete |
| Provider adapters for Claude, Codex, Cursor, Gemini | ✅ Complete |
| Batch upload with local queue persistence | ✅ Complete |
| Exponential backoff retry logic | ✅ Complete |
| PostgreSQL schema (organizations, users, machines, sessions, events) | ✅ Complete |
| REST API for batch/session/event ingestion | ✅ Complete |
| Zod request validation | ✅ Complete |
| OpenAPI 3.1 documentation with Swagger UI | ✅ Complete |
| Health check and version endpoints | ✅ Complete |
| Structured logging with Pino | ✅ Complete |
| Sync state tracking (local file-based) | ✅ Complete |
| File checksum-based change detection | ✅ Complete |
| Database migration runner | ✅ Complete |

### Excluded

| Feature | Reason |
|---------|--------|
| Authentication/Authorization | Deferred to Phase 02 - using API key placeholder |
| Real-time sync via WebSocket | Not needed for initial data migration |
| Analytics/Aggregation API | Phase 03 - dashboard frontend |
| ClickHouse for analytics | Phase 03 - will add for query performance |
| Alerting/Notifications | Phase 04 - billing integration |
| Web UI/Dashboard | Phase 03 - separate frontend package |
| Rate limiting | Phase 02 - when exposing public API |
| Request signing/HMAC | Phase 02 - when adding client authentication |

### Future Dependencies

- **Phase 02**: Authentication middleware, rate limiting, API key management
- **Phase 03**: Analytics aggregation, ClickHouse integration, dashboard frontend
- **Phase 04**: Billing integration, usage alerts, invoice generation
- **Phase 05**: Mobile app, Slack/Teams integrations

---

## 3. Architecture Overview

### High-Level Architecture

```mermaid
flowchart TB
    subgraph "Client Machine"
        CLI[AiInsight CLI]
        SE[Sync Engine]
        PQ[Upload Queue<br/>~/.config/aiinsight/upload-queue/]
        SS[Sync State<br/>~/.config/aiinsight/sync-state/]
    end

    subgraph "Cloud Infrastructure"
        API[Ingestion API<br/>Express + TypeScript]
        DB[(PostgreSQL)]
    end

    CLI -->|discovers sessions| SE
    SE -->|reads/writes| SS
    SE -->|persists batches| PQ
    SE -->|uploads via HTTP| API
    API -->|validates & stores| DB
```

### Data Flow

```mermaid
sequenceDiagram
    participant CLI as AiInsight CLI
    participant SE as Sync Engine
    participant Q as Upload Queue
    participant API as Ingestion API
    participant DB as PostgreSQL

    CLI->>SE: createSyncEngine(config)
    SE->>SE: initialize()
    SE->>SE: syncLoop.start()
    
    alt Historical Sync (first run)
        SE->>SE: historicalSync.runFullHistoricalSync()
        loop For each provider
            SE->>SE: provider.discoverSessions()
            SE->>SE: provider.createSessionParser()
            SE->>SE: parser.parse() -> ParsedProviderCall[]
            SE->>SE: adapter.adaptSession/Event()
            SE->>Q: persistBatch()
            SE->>API: POST /api/v1/ingest/batch
            API->>DB: INSERT sessions & events
            API-->>SE: {sessionsInserted, eventsInserted, duplicatesSkipped}
            SE->>SE: markSynced()
        end
    end

    loop Incremental Sync (every 5 min)
        SE->>SE: incrementalSync.runIncrementalSync()
        SE->>SE: check source unchanged (checksum)
        alt Source changed
            SE->>SE: parse & filter new calls
            SE->>Q: persistBatch()
            SE->>API: POST /api/v1/ingest/batch
            SE->>SE: markSynced()
        end
    end
```

### Component Responsibilities

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `SyncEngine` | `packages/sync-engine/src/index.ts` | Orchestrates sync lifecycle, manages services |
| `SyncLoop` | `packages/sync-engine/src/scheduler/syncLoop.ts` | Schedules historical then incremental sync |
| `HistoricalSyncService` | `packages/sync-engine/src/services/historicalSync.service.ts` | Full backfill of all provider data |
| `IncrementalSyncService` | `packages/sync-engine/src/services/incrementalSync.service.ts` | Delta sync for changed files |
| `BatchUploader` | `packages/sync-engine/src/uploader/batchUploader.ts` | Queue management, retry logic, HTTP upload |
| `IngestionClient` | `packages/sync-engine/src/api-client/ingestion.client.ts` | HTTP client for API communication |
| `syncState.repository` | `packages/sync-engine/src/state/syncState.repository.ts` | Local file-based sync state persistence |
| `Provider Adapters` | `packages/sync-engine/src/providers/*.sync.ts` | Transform ParsedProviderCall to SyncSession/SyncEvent |
| `ingestion.controller` | `apps/ingestion-api/src/controllers/ingestion.controller.ts` | Handle HTTP requests, orchestrate DB operations |
| `Repositories` | `apps/ingestion-api/src/repositories/*.ts` | Database access layer (CRUD operations) |
| `Validators` | `apps/ingestion-api/src/validators/ingestion.validator.ts` | Zod schemas for request validation |

### Boundaries

- **Sync Engine** runs on the developer's machine, reads local files
- **Ingestion API** runs in the cloud, receives HTTP requests
- **PostgreSQL** stores all persistent data
- **No direct DB access from Sync Engine** - all data flows through HTTP API

### Data Ownership

| Data | Owner | Location |
|------|-------|----------|
| Provider session files | CLI providers | `~/.local/share/<provider>/` |
| Sync state | Sync Engine | `~/.config/aiinsight/sync-state/` |
| Upload queue | Sync Engine | `~/.config/aiinsight/upload-queue/` |
| Organizations | Ingestion API | PostgreSQL `organizations` |
| Sessions | Ingestion API | PostgreSQL `sessions` |
| Events | Ingestion API | PostgreSQL `events` |

---

## 4. Folder Structure

### New Packages

```text
packages/sync-engine/
├── src/
│   ├── index.ts                    # SyncEngine class, exports
│   ├── api-client/
│   │   └── ingestion.client.ts     # HTTP client for API calls
│   ├── logging/
│   │   └── sync.logger.ts          # Pino logger with structured context
│   ├── providers/
│   │   ├── index.ts                # Adapter registry
│   │   ├── oss-types.ts            # Types copied from OSS parsers
│   │   ├── claude.sync.ts          # Claude adapter
│   │   ├── codex.sync.ts           # Codex adapter
│   │   ├── cursor.sync.ts          # Cursor adapter
│   │   └── gemini.sync.ts          # Gemini adapter
│   ├── scheduler/
│   │   └── syncLoop.ts             # Historical + incremental loop
│   ├── services/
│   │   ├── historicalSync.service.ts
│   │   └── incrementalSync.service.ts
│   ├── state/
│   │   └── syncState.repository.ts # Local file-based state
│   ├── types/
│   │   └── sync.types.ts           # All TypeScript interfaces
│   └── uploader/
│       └── batchUploader.ts        # Queue + retry + HTTP upload
├── package.json
└── tsconfig.json

apps/ingestion-api/
├── src/
│   ├── index.ts                    # Express app setup
│   ├── controllers/
│   │   └── ingestion.controller.ts # Request handlers
│   ├── database/
│   │   ├── pool.ts                 # PostgreSQL connection pool
│   │   ├── migrate.ts              # Migration runner
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_sessions_events.sql
│   │       └── 003_sync_tracking.sql
│   ├── logging/                    # (empty - using pino directly)
│   ├── middlewares/                 # (empty - reserved for auth)
│   ├── repositories/
│   │   ├── event.repository.ts
│   │   ├── machine.repository.ts
│   │   ├── organization.repository.ts
│   │   ├── provider.repository.ts
│   │   ├── session.repository.ts
│   │   ├── syncSource.repository.ts
│   │   ├── syncState.repository.ts
│   │   └── user.repository.ts
│   ├── routes/
│   │   ├── health.route.ts
│   │   ├── ingestion.routes.ts
│   │   └── openapi.route.ts
│   ├── services/                   # (empty - logic in controller)
│   └── validators/
│       └── ingestion.validator.ts  # Zod schemas
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 5. Database Changes

### Tables Created

#### `organizations`
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, email)
);
```

#### `machines`
```sql
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    os TEXT,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, hostname)
);
```

#### `providers` (Reference Data)
```sql
CREATE TABLE providers (
    id SMALLINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO providers (id, name) VALUES
    (1, 'claude'),
    (2, 'codex'),
    (3, 'cursor'),
    (4, 'gemini'),
    (5, 'warp'),
    (6, 'opencode');
```

#### `sessions`
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    provider_id SMALLINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    external_session_id TEXT NOT NULL,
    project_name TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    raw_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, external_session_id)
);
```

#### `events`
```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens BIGINT NOT NULL DEFAULT 0,
    cache_read_tokens BIGINT NOT NULL DEFAULT 0,
    cache_write_tokens BIGINT NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    payload JSONB NOT NULL
);
```

#### `sync_sources`
```sql
CREATE TABLE sync_sources (
    id BIGSERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    source_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    checksum TEXT,
    last_modified TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (machine_id, provider, source_path)
);
```

#### `sync_state`
```sql
CREATE TABLE sync_state (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    source_identifier TEXT NOT NULL,
    last_processed_at TIMESTAMPTZ,
    last_hash TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, machine_id, provider, source_identifier)
);
```

### Indexes Created

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `users` | `idx_users_org_id` | `organization_id` | Org user lookup |
| `machines` | `idx_machines_org_id` | `organization_id` | Org machine lookup |
| `machines` | `idx_machines_user_id` | `user_id` | User machine lookup |
| `sessions` | `idx_sessions_org_id` | `organization_id` | Org session lookup |
| `sessions` | `idx_sessions_machine_id` | `machine_id` | Machine session lookup |
| `sessions` | `idx_sessions_provider_id` | `provider_id` | Provider filter |
| `sessions` | `idx_sessions_started_at` | `started_at` | Time-range queries |
| `events` | `idx_events_org_id` | `organization_id` | Org event lookup |
| `events` | `idx_events_session_id` | `session_id` | Session events |
| `events` | `idx_events_event_time` | `event_time` | Time-range queries |
| `events` | `idx_events_model` | `model` | Model filter |
| `events` | `idx_events_event_type` | `event_type` | Event type filter |
| `events` | `idx_events_org_time` | `(organization_id, event_time DESC)` | Dashboard queries |
| `events` | `idx_events_session_time` | `(session_id, event_time)` | Session timeline |
| `sync_sources` | `idx_sync_sources_machine_id` | `machine_id` | Machine sources |
| `sync_sources` | `idx_sync_sources_provider` | `provider` | Provider filter |
| `sync_sources` | `idx_sync_sources_last_synced` | `last_synced_at` | Stale source detection |
| `sync_state` | `idx_sync_state_org_id` | `organization_id` | Org sync state |
| `sync_state` | `idx_sync_state_machine_id` | `machine_id` | Machine sync state |
| `sync_state` | `idx_sync_state_provider` | `provider` | Provider filter |
| `sync_state` | `idx_sync_state_source` | `source_identifier` | Source lookup |
| `sync_state` | `idx_sync_state_updated` | `updated_at` | Stale state detection |

### ER Diagram

```mermaid
erDiagram
    organizations ||--o{ users : has
    organizations ||--o{ machines : has
    organizations ||--o{ sessions : has
    organizations ||--o{ sync_state : has
    users ||--o{ machines : owns
    machines ||--o{ sync_sources : tracks
    machines ||--o{ sync_state : tracks
    providers ||--o{ sessions : categorized_by
    sessions ||--o{ events : contains
    sessions }o--|| machines : belongs_to

    organizations {
        uuid id PK
        text name
        timestamptz created_at
    }

    users {
        uuid id PK
        uuid organization_id FK
        text email
        text name
        timestamptz created_at
    }

    machines {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        text hostname
        text os
        timestamptz first_seen
        timestamptz last_seen
    }

    providers {
        smallint id PK
        text name
    }

    sessions {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        uuid machine_id FK
        smallint provider_id FK
        text external_session_id
        text project_name
        timestamptz started_at
        timestamptz ended_at
        jsonb raw_metadata
        timestamptz created_at
    }

    events {
        bigint id PK
        uuid organization_id FK
        uuid session_id FK
        timestamptz event_time
        text event_type
        text model
        bigint input_tokens
        bigint output_tokens
        bigint cache_read_tokens
        bigint cache_write_tokens
        numeric estimated_cost
        jsonb payload
    }

    sync_sources {
        bigint id PK
        uuid machine_id FK
        text provider
        text source_path
        bigint file_size
        text checksum
        timestamptz last_modified
        timestamptz last_synced_at
        timestamptz created_at
    }

    sync_state {
        bigint id PK
        uuid organization_id FK
        uuid machine_id FK
        text provider
        text source_identifier
        timestamptz last_processed_at
        text last_hash
        timestamptz updated_at
    }
```

### Deduplication Strategy

**Session Deduplication:**
- Unique constraint on `(provider_id, external_session_id)`
- Uses `ON CONFLICT ... DO UPDATE` for upsert behavior
- Updates `project_name`, `ended_at`, and `raw_metadata` on conflict

**Event Deduplication:**
- Optional `deduplicationKey` field in payload
- Checked via `SELECT 1 FROM events WHERE ... AND (payload->>'deduplicationKey') = $3`
- Returns `{ inserted, duplicates }` count to caller
- Duplicate events are silently skipped (not error)

### Multi-Tenant Strategy

- **Organization-level isolation**: All tables include `organization_id` FK
- **Cascade deletes**: Deleting an org removes all associated data
- **Machine-scoped sync**: Each machine tracks its own sync state
- **Provider normalization**: Providers stored as reference table with smallint FK

---

## 6. API Documentation

### POST /api/v1/ingest/batch

**Purpose:** Batch ingest sessions and events in a single request

**Request:**
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "machineId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "provider": "claude",
  "sessions": [
    {
      "externalSessionId": "sess_abc123",
      "projectName": "my-project",
      "startedAt": "2026-01-15T10:30:00Z",
      "endedAt": "2026-01-15T11:45:00Z",
      "rawMetadata": {
        "model": "claude-opus-4-5",
        "tools": ["bash", "edit", "read"]
      }
    }
  ],
  "events": [
    {
      "sessionId": "sess_abc123",
      "eventTime": "2026-01-15T10:30:00Z",
      "eventType": "completion",
      "model": "claude-opus-4-5",
      "inputTokens": 15000,
      "outputTokens": 2500,
      "cacheReadTokens": 5000,
      "cacheWriteTokens": 1000,
      "estimatedCost": 0.45,
      "payload": {
        "deduplicationKey": "sess_abc123_turn_1",
        "tools": ["bash", "edit"],
        "bashCommands": ["npm test"]
      }
    }
  ]
}
```

**Response (200):**
```json
{
  "sessionsInserted": 1,
  "eventsInserted": 1,
  "duplicatesSkipped": 0
}
```

**Validation:**
- `organizationId`: Required, UUID format
- `machineId`: Required, UUID format
- `provider`: Required, non-empty string
- `sessions[].externalSessionId`: Required, non-empty string
- `sessions[].startedAt`: Required, ISO 8601 datetime
- `events[].sessionId`: Required, non-empty string
- `events[].model`: Required, non-empty string
- `events[].inputTokens`: Required, non-negative integer
- `events[].payload`: Required, object

**Error Scenarios:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `Validation failed` | Invalid request body schema |
| 400 | `Unknown provider: <name>` | Provider not in providers table |
| 404 | `Organization not found` | Invalid organizationId |
| 500 | `Internal server error` | Unexpected server error |

### POST /api/v1/ingest/sessions

**Purpose:** Ingest sessions only (without events)

**Request:**
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "machineId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "provider": "codex",
  "sessions": [
    {
      "externalSessionId": "codex_sess_456",
      "projectName": "another-project",
      "startedAt": "2026-01-15T14:00:00Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "sessionsInserted": 1
}
```

### POST /api/v1/ingest/events

**Purpose:** Ingest events only (sessions must exist)

**Request:**
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "machineId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "provider": "cursor",
  "events": [
    {
      "sessionId": "cursor_sess_789",
      "eventTime": "2026-01-15T15:30:00Z",
      "eventType": "completion",
      "model": "gpt-4o",
      "inputTokens": 8000,
      "outputTokens": 1200,
      "payload": {}
    }
  ]
}
```

**Response (200):**
```json
{
  "eventsInserted": 1,
  "duplicatesSkipped": 0
}
```

### GET /api/v1/health

**Purpose:** Health check endpoint

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

**Response (503):**
```json
{
  "status": "error",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "error": "Database connection failed"
}
```

### GET /api/v1/version

**Purpose:** Get API version

**Response (200):**
```json
{
  "version": "0.1.0",
  "name": "aiinsight-ingestion-api"
}
```

### GET /api/openapi.json

**Purpose:** OpenAPI 3.1 specification

Returns the full OpenAPI JSON document for code generation and documentation.

### GET /api/docs

**Purpose:** Swagger UI documentation

Interactive API documentation powered by Swagger UI.

---

## 7. Synchronization Design

### Historical Sync

**How it works:**

1. Runs on first sync or when `historicalCompleted` flag is false
2. Iterates through filtered providers: `['claude', 'codex', 'cursor', 'gemini']`
3. For each provider:
   - Calls `provider.discoverSessions()` to find all session files
   - For each source file:
     - Checks sync state to see if already processed
     - Computes file checksum to detect changes
     - If unchanged, skips (optimization)
     - If changed or new, parses all calls via `provider.createSessionParser()`
     - Transforms calls to `SyncSession[]` and `SyncEvent[]` via provider adapter
     - Uploads in batches (default 1000 events per batch)
     - Marks source as synced with new checksum

**Code Reference:** `packages/sync-engine/src/services/historicalSync.service.ts:33-71`

### Incremental Sync

**How it works:**

1. Runs every 5 minutes after initial historical sync
2. Same provider iteration as historical
3. For each source:
   - Checks if file has changed (checksum comparison)
   - If unchanged, skips immediately
   - If changed, parses all calls
   - Filters to only new calls (currently returns all - see Known Limitations)
   - Uploads only new events
   - Updates sync state

**Code Reference:** `packages/sync-engine/src/services/incrementalSync.service.ts:33-74`

### Watermark Strategy

**Current Implementation:**
- Uses file checksum (SHA-256) as watermark
- Stored in local file: `~/.config/aiinsight/sync-state/<provider>_<hash>.json`
- File is named by SHA-256 of `orgId:machineId:provider:sourceIdentifier`

**Watermark Record:**
```typescript
interface SyncStateRecord {
  organizationId: string;
  machineId: string;
  provider: string;
  sourceIdentifier: string;
  lastProcessedAt?: Date;
  lastHash?: string;  // The watermark
  updatedAt: Date;
}
```

**Code Reference:** `packages/sync-engine/src/state/syncState.repository.ts:91-114`

### File Tracking Strategy

**Discovery:**
- Each provider implements `discoverSessions()` returning `SessionSource[]`
- Returns path, project name, and provider identifier
- Example: Claude scans `~/.claude/projects/*/sessions/*.jsonl`

**Change Detection:**
- `getSourceStats()` computes file size, mtime, and SHA-256 checksum
- `isSourceUnchanged()` compares stored hash with current hash
- If hash matches, file is skipped (no re-parsing)

**Code Reference:** `packages/sync-engine/src/state/syncState.repository.ts:97-114`

### Failure Recovery Strategy

**Upload Queue:**
- Batches are persisted to `~/.config/aiinsight/upload-queue/` before HTTP upload
- On crash, queue is reloaded on next `initialize()`
- Failed batches remain in queue for retry

**Retry Logic:**
- Exponential backoff: `baseDelayMs * 2^(attempt-1)`
- Default: 1000ms, 2000ms, 4000ms (3 attempts)
- After max retries, batch stays in queue for next run

**Idempotency:**
- Sessions: `ON CONFLICT ... DO UPDATE` ensures idempotent upsert
- Events: Optional `deduplicationKey` prevents duplicate inserts
- Server returns `duplicatesSkipped` count for visibility

**Code Reference:** `packages/sync-engine/src/uploader/batchUploader.ts:58-78`

---

## 8. Logging Strategy

### Logging Framework

- **Library:** Pino (high-performance JSON logger)
- **Configuration:** `packages/sync-engine/src/logging/sync.logger.ts`
- **Level:** Configurable via `SYNC_LOG_LEVEL` env var (default: `info`)

### Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Checksum calculations, source unchanged, session deduplication |
| `info` | Sync start/finish, provider detected, batch uploaded, source discovered |
| `warn` | Retry attempts, sync loop already running |
| `error` | Upload failures, provider sync failures, database insert failures |

### Correlation IDs

Every sync operation generates a `operationId` (UUID) that is attached to all log messages:

```typescript
const operationId = crypto.randomUUID();
const logger = createOperationLogger({
  operationId,
  organizationId: config.organizationId,
  machineId: config.machineId,
  provider: 'all',
});
```

### Traceability

Log messages include structured context:
- `operationId` - Unique per sync run
- `organizationId` - Tenant identifier
- `machineId` - Source machine
- `provider` - Provider name (e.g., 'claude')
- `sourcePath` - File being processed

### Example Logs

```json
{
  "level": "info",
  "time": "2026-01-15T12:00:00.000Z",
  "service": "aiinsight-sync-engine",
  "operationId": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "org_123",
  "machineId": "machine_456",
  "provider": "claude",
  "operation": "historical_sync",
  "event": "historical_sync_start",
  "msg": "Historical sync started"
}
```

```json
{
  "level": "info",
  "time": "2026-01-15T12:00:05.000Z",
  "service": "aiinsight-sync-engine",
  "operationId": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "batch_uploaded",
  "event": "batch_uploaded",
  "sessionsInserted": 15,
  "eventsInserted": 234,
  "duplicatesSkipped": 2,
  "msg": "Batch uploaded successfully"
}
```

### Debugging Guide

1. **Sync not running:** Check `SYNC_LOG_LEVEL=debug` and look for `sync_loop` messages
2. **Provider not discovered:** Look for `provider_detected` log with session count
3. **Upload failing:** Check `batch_failed` logs for HTTP status codes
4. **Duplicates appearing:** Check `deduplicationKey` in payload and `duplicatesSkipped` count

---

## 9. Reliability Features

### Retry Policies

| Component | Strategy | Max Retries | Base Delay |
|-----------|----------|-------------|------------|
| `BatchUploader` | Exponential backoff | 3 | 1000ms |
| `SyncLoop` | Continue on error | N/A | N/A |

**Backoff Formula:** `delay = baseDelayMs * 2^(attempt - 1)`
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms (then fail)

**Code Reference:** `packages/sync-engine/src/uploader/batchUploader.ts:58-78`

### Idempotency Strategy

**Sessions:**
```sql
INSERT INTO sessions (...) VALUES (...)
ON CONFLICT (provider_id, external_session_id)
DO UPDATE SET
  project_name = EXCLUDED.project_name,
  ended_at = EXCLUDED.ended_at,
  raw_metadata = EXCLUDED.raw_metadata
```

**Events:**
- Optional `deduplicationKey` in payload
- Checked before insert:
  ```sql
  SELECT 1 FROM events 
  WHERE organization_id = $1 AND session_id = $2 
  AND (payload->>'deduplicationKey') = $3
  LIMIT 1
  ```
- If exists, skip insert and increment `duplicates` counter

### Duplicate Prevention

1. **Session-level:** Unique constraint on `(provider_id, external_session_id)`
2. **Event-level:** Optional deduplication key check
3. **Sync-level:** Checksum-based change detection prevents re-processing unchanged files
4. **Queue-level:** Batch persistence ensures exactly-once delivery semantics

### Recovery Mechanisms

1. **Crash Recovery:** Upload queue persisted to disk, reloaded on startup
2. **Partial Failure:** Failed batches remain in queue, retried on next sync
3. **Source Corruption:** Checksum mismatch triggers re-parse
4. **API Downtime:** Batches queued locally until API recovers

---

## 10. Security Considerations

### Authentication

**Current State:** Not implemented (placeholder API key)

```typescript
// In batchUploader.ts
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.config.apiKey}`,
}
```

**Phase 02 Plan:**
- JWT-based authentication
- API key management dashboard
- Token refresh flow

### Authorization

**Current State:** Not implemented

**Phase 02 Plan:**
- Organization-scoped access control
- Role-based permissions (admin, viewer)
- API key scoping (read-only, write-only)

### Tenant Isolation

**Implemented:**
- All tables include `organization_id` FK
- Cascade deletes ensure data cleanup
- Queries filter by `organization_id`

**Not Implemented:**
- Row-level security (RLS) policies
- Schema-per-tenant isolation

### Sensitive Data Handling

**Stored in Plain Text:**
- Session metadata (project names, tool usage)
- Token counts and cost estimates

**Not Stored:**
- API keys (stored in environment variables)
- User passwords (not collected yet)
- File contents (only metadata)

**Phase 02 Plan:**
- Encrypt sensitive fields at rest
- Audit logging for data access
- PII detection and masking

### Data Retention

**Current State:** No retention policy

**Phase 02 Plan:**
- Configurable retention periods per organization
- Automatic data archival
- GDPR-compliant deletion

---

## 11. Technical Decisions

### Decision: Local File-Based Sync State

**Alternatives Considered:**
1. PostgreSQL `sync_state` table
2. Redis cache
3. Local file system

**Why Chosen:**
- Sync engine runs on developer machines (no guaranteed network)
- Avoids dependency on cloud infrastructure for core functionality
- Simple implementation with no external dependencies
- File naming uses content-addressable hash for collision avoidance

**Tradeoffs:**
- No centralized view of sync state across machines
- Manual cleanup required for orphaned state files
- Limited to single-machine sync per state directory

### Decision: JSONB Payload Storage

**Alternatives Considered:**
1. Provider-specific tables
2. Normalized schema with many columns
3. External blob storage

**Why Chosen:**
- Provider schemas evolve rapidly (new fields added frequently)
- Avoids schema migration churn for every provider update
- Enables flexible queries via JSON operators
- Full payload preserved for debugging and reprocessing

**Tradeoffs:**
- Less efficient for aggregation queries (requires JSON extraction)
- Larger storage footprint
- No schema validation at database level

### Decision: Batch Upload with Local Queue

**Alternatives Considered:**
1. Direct HTTP upload per event
2. Streaming upload
3. File-based export (S3, GCS)

**Why Chosen:**
- Reduces HTTP overhead (1000 events per request)
- Local queue provides durability guarantee
- Exponential backoff handles transient failures
- Simple implementation without distributed queue dependency

**Tradeoffs:**
- Delayed visibility (events not immediately queryable)
- Local disk space consumption
- No exactly-once delivery guarantee (deduplication handled server-side)

### Decision: Provider Adapter Pattern

**Alternatives Considered:**
1. Direct transformation in sync engine
2. Shared transformation library
3. GraphQL schema stitching

**Why Chosen:**
- Each provider has unique session/event structure
- Adapters encapsulate provider-specific logic
- Easy to add new providers without modifying core
- Adapters are stateless and testable

**Tradeoffs:**
- Code duplication across adapters (minimal)
- Adapter registration required for new providers
- No shared validation logic

### Decision: Express + TypeScript for API

**Alternatives Considered:**
1. Fastify
2. NestJS
3. Go/Rust for performance

**Why Chosen:**
- Team expertise in TypeScript
- Shared types with sync engine (monorepo)
- Rich middleware ecosystem
- Fast development velocity

**Tradeoffs:**
- Single-threaded (limited concurrency)
- No built-in schema validation (added via Zod)
- Requires careful async handling

---

## 12. Known Limitations

### Current Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No authentication | Anyone can POST to API | Deploy behind VPN/API gateway |
| No rate limiting | DDoS vulnerability | Add rate limiting in Phase 02 |
| Incremental sync re-parses all calls | Performance overhead on large files | Implement hash-based filtering |
| No WebSocket real-time updates | Delayed data visibility | Polling or SSE in Phase 02 |
| No analytics/aggregation API | Cannot query aggregated data | Phase 03 - dashboard |
| No ClickHouse | Slow analytical queries | Phase 03 - add ClickHouse |
| No alerting | No cost threshold notifications | Phase 04 - billing integration |
| No web UI | CLI-only interface | Phase 03 - dashboard frontend |
| No multi-region support | Single region deployment | Phase 05 - multi-region |
| No data export API | Manual CSV/JSON export only | Phase 03 - add export endpoints |
| Provider filter hardcoded | Only Claude, Codex, Cursor, Gemini | Make configurable |
| No request signing | Vulnerable to request tampering | Phase 02 - HMAC signing |
| No audit logging | No access trail | Phase 02 - add audit logs |

### Technical Debt

1. **Duplicated Types:** `oss-types.ts` copies types from OSS parsers (must stay in sync)
2. **Empty Directories:** `middlewares/`, `logging/`, `services/` in ingestion-api (reserved but unused)
3. **Controller Logic:** Business logic in controller (should move to services layer)
4. **No Error Codes:** API returns generic errors (should use error code enum)

---

## 13. Future Work

### P0 (Next Sprint)

| Task | Description | Dependencies |
|------|-------------|--------------|
| Authentication middleware | JWT validation, API key management | None |
| Rate limiting | Per-tenant request throttling | Authentication |
| Provider filter config | Make provider list configurable | None |
| Request signing | HMAC signature verification | None |

### P1 (Next Quarter)

| Task | Description | Dependencies |
|------|-------------|--------------|
| Analytics aggregation API | Query endpoints for dashboard | P0 |
| ClickHouse integration | Fast analytical queries | Analytics API |
| Dashboard frontend | React/Next.js web UI | Analytics API |
| Data export API | CSV/JSON export endpoints | None |
| Audit logging | Track data access | Authentication |

### P2 (Next Half)

| Task | Description | Dependencies |
|------|-------------|--------------|
| Real-time sync | WebSocket updates | Authentication |
| Billing integration | Usage-based billing | Analytics API |
| Multi-region deployment | Geographic distribution | Infrastructure |
| Mobile app | iOS/Android usage viewer | Analytics API |
| Slack/Teams integration | Cost alerts and reports | Billing |

---

## 14. Testing Coverage

### Unit Tests

| Package | Test Files | Coverage |
|---------|------------|----------|
| `@aiinsight/sync-engine` | 0 | 0% |
| `@aiinsight/ingestion-api` | 0 | 0% |
| CLI (existing) | 89 files | ~75% |

### Integration Tests

| Test | Status |
|------|--------|
| End-to-end sync flow | Not implemented |
| API endpoint validation | Not implemented |
| Database migration tests | Not implemented |

### Testing Gaps

1. No unit tests for sync engine services
2. No integration tests for API endpoints
3. No database migration tests
4. No load testing for batch uploads
5. No chaos testing for failure scenarios

---

## 15. Deployment Notes

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `PORT` | No | `3001` | API server port |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `NODE_ENV` | No | `development` | Environment mode |
| `SYNC_LOG_LEVEL` | No | `info` | Sync engine log level |

### Required Services

| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 14+ | Primary data store |
| Node.js | 22.13.0+ | Runtime |
| TypeScript | 5.8+ | Build toolchain |

### Database Requirements

1. PostgreSQL 14+ with UUID extension
2. Create database: `CREATE DATABASE aiinsight;`
3. Run migrations: `npm run api:migrate`

### Migration Process

```bash
# 1. Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/aiinsight"

# 2. Run migrations
cd apps/ingestion-api
npm run migrate

# 3. Verify
psql $DATABASE_URL -c "\dt"  # Should show all tables
```

### Rollback Strategy

**Current:** Manual rollback required

```bash
# 1. Drop tables in reverse order
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_state CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_sources CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS events CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sessions CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS machines CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS users CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS organizations CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS providers CASCADE;"

# 2. Remove migration records
psql $DATABASE_URL -c "DROP TABLE IF EXISTS schema_migrations;"
```

**Phase 02 Plan:**
- Versioned migrations with rollback scripts
- Automated rollback on deployment failure

### Docker Deployment

The ingestion API can be deployed via Docker instead of manual Node.js setup.

```bash
# Build and start
docker compose up --build -d

# Run migrations inside the container
docker compose exec ingestion-api node dist/database/migrate.js

# Check logs
docker compose logs -f ingestion-api
```

Environment variables are configured in `docker-compose.yml` or overridden via `.env`:

| Variable | Docker Default | Description |
|----------|---------------|-------------|
| `DATABASE_URL` | `postgresql://aiinsight:aiinsight_secret@postgres:5432/aiinsight` | PostgreSQL connection string |
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `production` | Environment mode |
| `LOG_LEVEL` | `info` | Pino log level |

The Docker Compose stack also includes PostgreSQL (`postgres:16-alpine`) with a persistent volume and health checks. See `docker-compose.yml` at the project root for the full configuration.

---

## 16. Lessons Learned

### Risks Discovered

1. **Type Synchronization Risk:** `oss-types.ts` must stay in sync with OSS parser types
   - **Mitigation:** Add CI check to verify type compatibility
   
2. **Migration Ordering Risk:** Migrations must run in order
   - **Mitigation:** Migration runner already handles this, but add tests

3. **Provider Filter Hardcoded:** Only 4 providers in sync engine
   - **Mitigation:** Make configurable via environment variable

### Technical Debt Introduced

1. **Empty directories:** `middlewares/`, `logging/`, `services/` created but unused
   - **Recommendation:** Remove or populate in Phase 02

2. **Controller business logic:** Ingestion controller contains business logic
   - **Recommendation:** Extract to service layer

3. **No error codes:** API returns generic error messages
   - **Recommendation:** Implement error code enum

4. **Duplicate upload logic:** `BatchUploader` and `IngestionClient` both have upload methods
   - **Recommendation:** Consolidate to single upload path

### Refactoring Opportunities

1. **Extract service layer** from ingestion controller
2. **Consolidate upload logic** between BatchUploader and IngestionClient
3. **Add shared types package** to avoid type duplication
4. **Implement repository pattern** consistently across all entities

### Scalability Concerns

1. **Single-threaded API:** Express is single-threaded
   - **Future:** Consider clustering or migration to Fastify

2. **No connection pooling configuration:** Default pg pool settings
   - **Future:** Tune pool size based on load testing

3. **No caching layer:** Every query hits database
   - **Future:** Add Redis for hot data caching

4. **File-based sync state:** Doesn't scale across multiple machines
   - **Future:** Consider centralized state storage

---

*Document generated: 2026-06-11*
*Phase: 01 - Cloud Foundation*
*Status: Implementation Complete*
