# Agent Lifecycle

## Overview

```mermaid
graph LR
    A[Enrollment Key] -->|Register| B[Machine]
    B -->|JWT| C[Authenticated Agent]
    C -->|Heartbeat| D[Online]
    C -->|Sync| E[Data Uploaded]
    D -->|5 min no heartbeat| F[Offline]
```

---

## Registration

```mermaid
sequenceDiagram
    participant Agent as Sync Engine
    participant DA as Dashboard API
    participant DB as PostgreSQL
    participant E as Email Service

    Agent->>DA: POST /api/v1/agents/register
    Note over Agent: Header: Authorization: Bearer ai_live_...
    Note over Agent: Body: { hostname, os, architecture, agentVersion }
    DA->>DB: SELECT organization_enrollment_keys WHERE prefix
    DA->>DA: Verify Argon2 hash
    DA->>DA: Check expiry
    DA->>DB: UPSERT machines (ON CONFLICT organization_id, hostname)
    DA->>DA: Sign JWT with machineId
    DA->>DB: INSERT INTO agent_tokens (90d expiry)
    DA->>E: Send agent-connected email to org owner
    DA-->>Agent: { machineId, agentToken, syncInterval }
```

### Machine Identity

Machines are identified by `(organization_id, hostname)`. If a machine with the same hostname registers again, its fields are updated (OS, architecture, version, status).

### Enrollment Key

- Format: `ai_live_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`
- Stored as Argon2 hash
- Optional expiry
- Can be revoked or rotated via dashboard
- One enrollment key can register multiple machines

---

## Heartbeat

```mermaid
sequenceDiagram
    participant Agent as Sync Engine
    participant DA as Dashboard API
    participant DB as PostgreSQL

    loop Every sync interval (default 300s)
        Agent->>DA: POST /api/v1/agents/heartbeat
        Note over Agent: Header: Authorization: Bearer <agent-jwt>
        Note over Agent: Body: { machineId }
        DA->>DA: Verify JWT
        DA->>DB: UPDATE machines SET last_seen=NOW(), status='ONLINE'
        DA-->>Agent: { status: "ok" }
    end
```

---

## Status Updates

Machine status is tracked in the `machines.status` column:

| Status | Meaning |
|--------|---------|
| `ONLINE` | Heartbeat received within last 5 minutes |
| `OFFLINE` | No heartbeat for more than 5 minutes |
| `UNKNOWN` | Initial state before first heartbeat |

---

## Offline Detection

A background job runs every 60 seconds on the Dashboard API:

```mermaid
sequenceDiagram
    participant Job as Offline Detection Job
    participant DB as PostgreSQL

    loop Every 60 seconds
        Job->>DB: UPDATE machines SET status='OFFLINE' WHERE status='ONLINE' AND last_seen < NOW() - INTERVAL '5 minutes'
        alt Machines updated
            Job->>Job: Log "[offline-detection] Marked N machine(s) as OFFLINE"
        end
    end
```

The job starts automatically when the Dashboard API starts.

---

## Agent Configuration

Authenticated agents can retrieve their configuration:

```mermaid
sequenceDiagram
    participant Agent as Sync Engine
    participant DA as Dashboard API
    participant DB as PostgreSQL

    Agent->>DA: GET /api/v1/agents/config
    Note over Agent: Header: Authorization: Bearer <agent-jwt>
    DA->>DB: SELECT machines JOIN organizations
    DA-->>Agent: { apiUrl, organizationId, machineId, syncInterval, environment }
```

---

## Agent Tokens

Agent tokens are JWTs issued during registration:

- Algorithm: HS256
- Expiry: 90 days
- Payload: `sub` (user ID), `orgId`, `role: "agent"`, `machineId`
- Stored as SHA-256 hash in `agent_tokens` table
- `last_used_at` updated on each heartbeat

---

## Data Flow After Registration

```mermaid
sequenceDiagram
    participant Agent as Sync Engine
    participant IA as Ingestion API

    Note over Agent: Agent has machineId + apiKey
    Agent->>Agent: Discover JSONL files
    Agent->>Agent: Parse + normalize
    Agent->>IA: POST /api/v1/ingest/batch
    Note over Agent: Header: Authorization: Bearer <api-key>
    IA->>IA: Normalize + store
    IA-->>Agent: 200 OK
```

The sync engine uses the organization's API key (created via dashboard) to authenticate with the Ingestion API, not the agent token.

---

## Machine Detail

The `GET /api/v1/machines/:id` endpoint returns:

| Field | Description |
|-------|-------------|
| Machine info | hostname, os, architecture, agent_version, status, first_seen, last_seen |
| Usage metrics | total sessions, events, tokens, cost (from events table) |
| Recent sessions | Last 10 sessions with token/cost data |
| Cost by model | Aggregated cost per model |
| Cost over time | Daily cost trend (last 30 days) |
| Agent tokens | List of issued agent tokens with last_used_at |
