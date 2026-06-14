# Phase 02: Analytics & Dashboard Foundation

## 1. Executive Summary

### What Was Built

AiInsight Cloud Phase 2 introduces three new packages that enable analytics aggregation, a dashboard API, and a web-based dashboard:

1. **`@aiinsight/analytics-engine`** - Core aggregation library that computes daily usage summaries from raw events
2. **`@aiinsight/dashboard-api`** - Express REST API serving pre-aggregated analytics data with JWT and API key authentication
3. **`@aiinsight/dashboard-web`** - Next.js 15 frontend with interactive charts and data tables

### Why It Was Built

Phase 1 established the data ingestion pipeline, but teams still lack:
- **Real-time visibility** - No way to see aggregated costs without CLI access
- **Team analytics** - Cannot compare usage across developers, models, or projects
- **Historical trends** - No way to track cost growth over time
- **Role-based access** - No authentication or multi-tenant dashboard isolation

### Business Objective

Enable AiInsight Cloud as a self-service analytics platform where teams can:
- Monitor AI coding costs in real-time via web dashboard
- Drill down by provider, model, user, and project
- Track usage trends over time with configurable granularity
- Manage team access with role-based authentication

### Technical Objective

Build an analytics foundation that:
- Reads from precomputed aggregates (never queries raw events directly)
- Scales horizontally with stateless API servers
- Provides sub-500ms dashboard response times
- Maintains multi-tenant isolation across all queries

### Problems Solved

1. **No Team Dashboard** - Teams cannot visualize aggregate AI coding costs
2. **No Cost Attribution** - Cannot attribute costs to specific developers or projects
3. **No Trend Analysis** - No way to track cost growth or identify anomalies
4. **No Access Control** - No authentication or role-based permissions

---

## 2. Scope of This Phase

### Included

| Feature | Status |
|---------|--------|
| Analytics Engine with 5 aggregators | ✅ Complete |
| Daily aggregation job (hourly runs) | ✅ Complete |
| Historical backfill job (resume-capable) | ✅ Complete |
| 7 database migrations (aggregation tables + auth) | ✅ Complete |
| Dashboard API with 6 query endpoints | ✅ Complete |
| JWT + API key dual authentication | ✅ Complete |
| Zod request validation | ✅ Complete |
| Structured logging with Pino | ✅ Complete |
| Next.js 15 web dashboard | ✅ Complete |
| 7 dashboard pages (Overview, Providers, Models, Users, Projects, Trends, Login) | ✅ Complete |
| 3 chart components (Trend, Provider, Bar) | ✅ Complete |
| TanStack Query for data fetching | ✅ Complete |

### Excluded

| Feature | Reason |
|---------|--------|
| ClickHouse integration | Phase 03 - for high-scale analytics |
| Real-time WebSocket updates | Phase 03 - for live data streaming |
| Alerting/Notifications | Phase 04 - billing integration |
| Billing integration | Phase 04 - subscription management |
| Mobile app | Phase 05 - responsive web first |
| Data export API | Phase 03 - CSV/JSON export endpoints |
| Row-level security (RLS) | Phase 03 - when adding public API |

### Future Dependencies

- **Phase 03**: ClickHouse for high-scale analytics, real-time streaming, data export
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
    end

    subgraph "Cloud Infrastructure"
        API[Ingestion API<br/>Express + TypeScript]
        AE[Analytics Engine<br/>Aggregation Library]
        DA[Dashboard API<br/>Express + TypeScript]
        DW[Dashboard Web<br/>Next.js 15]
        DB[(PostgreSQL)]
    end

    CLI -->|discovers sessions| SE
    SE -->|uploads via HTTP| API
    API -->|validates & stores| DB
    AE -->|reads raw events| DB
    AE -->|writes aggregates| DB
    DA -->|reads aggregates| DB
    DW -->|fetches via HTTP| DA
```

### Data Flow

```mermaid
sequenceDiagram
    participant CLI as AiInsight CLI
    participant SE as Sync Engine
    participant API as Ingestion API
    participant DB as PostgreSQL
    participant AE as Analytics Engine
    participant DA as Dashboard API
    participant DW as Dashboard Web

    CLI->>SE: sync sessions & events
    SE->>API: POST /api/v1/ingest/batch
    API->>DB: INSERT sessions & events

    Note over AE: Runs hourly (daily aggregation)
    AE->>DB: SELECT FROM events WHERE date = yesterday
    AE->>DB: UPSERT INTO daily_usage, daily_provider_usage, etc.

    Note over AE: Runs on demand (historical backfill)
    AE->>DB: SELECT min/max date from events
    AE->>DB: Process unaggregated dates

    DW->>DA: GET /api/v1/dashboard/overview?period=30d
    DA->>DB: SELECT FROM daily_usage WHERE org = ?
    DA-->>DW: DashboardOverview

    DW->>DA: GET /api/v1/dashboard/providers?period=30d
    DA->>DB: SELECT FROM daily_provider_usage JOIN providers
    DA-->>DW: ProviderAnalytics[]
```

### Component Responsibilities

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `AnalyticsRepository` | `packages/analytics-engine/src/repositories/analytics.repository.ts` | Database queries for aggregation and dashboard |
| `AnalyticsService` | `packages/analytics-engine/src/services/analytics.service.ts` | Service facade for aggregation jobs |
| `DailyAggregationJob` | `packages/analytics-engine/src/jobs/dailyAggregation.job.ts` | Aggregate yesterday's data for all orgs |
| `HistoricalBackfillJob` | `packages/analytics-engine/src/jobs/historicalBackfill.job.ts` | Backfill historical data with resume capability |
| 5 Aggregators | `packages/analytics-engine/src/aggregators/*.ts` | Compute daily summaries per dimension |
| `DashboardController` | `apps/dashboard-api/src/controllers/dashboard.controller.ts` | HTTP request handlers |
| `DashboardService` | `apps/dashboard-api/src/services/dashboard.service.ts` | Business logic for dashboard queries |
| `DashboardRepository` | `apps/dashboard-api/src/repositories/dashboard.repository.ts` | Read-only queries from aggregate tables |
| `AuthMiddleware` | `apps/dashboard-api/src/middlewares/auth.middleware.ts` | JWT + API key authentication |
| `QueryValidator` | `apps/dashboard-api/src/validators/query.validator.ts` | Zod schemas for request validation |
| Dashboard Web Pages | `apps/dashboard-web/src/app/*/page.tsx` | Next.js page components |
| Chart Components | `apps/dashboard-web/src/components/charts/*.tsx` | Recharts visualization components |
| API Client | `apps/dashboard-web/src/lib/api.ts` | HTTP client for dashboard API |
| Auth Context | `apps/dashboard-web/src/lib/auth-context.tsx` | React context for authentication state |

### Boundaries

- **Analytics Engine** is a library consumed by Dashboard API and jobs
- **Dashboard API** serves pre-aggregated data only (never queries raw events)
- **Dashboard Web** is a client-side Next.js app consuming Dashboard API
- **Ingestion API** remains unchanged from Phase 1

### Data Ownership

| Data | Owner | Location |
|------|-------|----------|
| Raw events | Ingestion API | PostgreSQL `events` |
| Aggregated summaries | Analytics Engine | PostgreSQL `daily_*` tables |
| Dashboard queries | Dashboard API | PostgreSQL `daily_*` tables |
| Auth tokens | Dashboard API | PostgreSQL `api_keys`, `refresh_tokens` |
| User sessions | Dashboard Web | localStorage (`aiinsight_token`) |

---

## 4. Folder Structure

### New Packages

```text
packages/analytics-engine/
├── src/
│   ├── index.ts                         # Public exports
│   ├── aggregators/
│   │   ├── dailyUsageAggregator.ts      # Org-level daily summary
│   │   ├── providerUsageAggregator.ts   # Per-provider daily summary
│   │   ├── modelUsageAggregator.ts      # Per-model daily summary
│   │   ├── userUsageAggregator.ts       # Per-user daily summary
│   │   └── projectUsageAggregator.ts    # Per-project daily summary
│   ├── jobs/
│   │   ├── dailyAggregation.job.ts      # Hourly aggregation for yesterday
│   │   └── historicalBackfill.job.ts    # Backfill historical data
│   ├── logging/
│   │   └── analytics.logger.ts          # Pino logger with context
│   ├── repositories/
│   │   └── analytics.repository.ts      # Database queries
│   ├── services/
│   │   └── analytics.service.ts         # Service facade
│   └── types/
│       └── analytics.types.ts           # TypeScript interfaces
├── package.json
└── tsconfig.json

apps/dashboard-api/
├── src/
│   ├── index.ts                         # Express app setup
│   ├── controllers/
│   │   └── dashboard.controller.ts      # Request handlers
│   ├── database/
│   │   └── pool.ts                      # PostgreSQL connection pool
│   ├── logging/
│   │   └── dashboard.logger.ts          # Pino logger with context
│   ├── middlewares/
│   │   └── auth.middleware.ts           # JWT + API key auth
│   ├── repositories/
│   │   └── dashboard.repository.ts      # Read-only aggregate queries
│   ├── routes/
│   │   ├── dashboard.routes.ts          # Dashboard endpoints
│   │   ├── auth.routes.ts               # Login/refresh endpoints
│   │   └── health.route.ts              # Health check
│   ├── services/
│   │   └── dashboard.service.ts         # Business logic
│   └── validators/
│       └── query.validator.ts           # Zod schemas
├── .env.example
├── package.json
└── tsconfig.json

apps/dashboard-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout with providers
│   │   ├── page.tsx                     # Home (Overview)
│   │   ├── globals.css                  # Tailwind CSS
│   │   ├── login/page.tsx               # Login page
│   │   ├── providers/page.tsx           # Provider analytics
│   │   ├── models/page.tsx              # Model analytics
│   │   ├── users/page.tsx               # User analytics
│   │   ├── projects/page.tsx            # Project analytics
│   │   └── trends/page.tsx              # Usage trends
│   ├── components/
│   │   ├── DashboardShell.tsx           # Layout with nav
│   │   ├── PeriodSelector.tsx           # Period dropdown
│   │   ├── pages/                       # Page components
│   │   ├── ui/                          # Card, Select primitives
│   │   └── charts/                      # Recharts components
│   │       ├── BarChart.tsx
│   │       ├── ProviderChart.tsx
│   │       └── TrendChart.tsx
│   ├── hooks/
│   │   └── useDashboard.ts             # TanStack Query hooks
│   ├── lib/
│   │   ├── api.ts                       # API client
│   │   ├── auth-context.tsx            # Auth React context
│   │   └── utils.ts                     # Utility functions
│   └── types/
│       └── dashboard.ts                 # TypeScript interfaces
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 5. Database Changes

### Tables Created

#### `aggregation_runs`
Tracks aggregation job execution for monitoring and debugging.

```sql
CREATE TABLE aggregation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    aggregation_type TEXT NOT NULL,           -- 'daily', 'historical_backfill'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',   -- 'running', 'completed', 'failed'
    records_processed BIGINT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `daily_usage`
Organization-level daily usage summary.

```sql
CREATE TABLE daily_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    total_sessions BIGINT NOT NULL DEFAULT 0,
    total_users BIGINT NOT NULL DEFAULT 0,
    total_input_tokens BIGINT NOT NULL DEFAULT 0,
    total_output_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, usage_date)
);
```

#### `daily_provider_usage`
Per-provider daily usage summary.

```sql
CREATE TABLE daily_provider_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id SMALLINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    usage_date DATE NOT NULL,
    total_sessions BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider_id, usage_date)
);
```

#### `daily_model_usage`
Per-model daily usage summary.

```sql
CREATE TABLE daily_model_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    usage_date DATE NOT NULL,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    session_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, model, usage_date)
);
```

#### `daily_user_usage`
Per-user daily usage summary.

```sql
CREATE TABLE daily_user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    session_count BIGINT NOT NULL DEFAULT 0,
    token_count BIGINT NOT NULL DEFAULT 0,
    cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id, usage_date)
);
```

#### `daily_project_usage`
Per-project daily usage summary.

```sql
CREATE TABLE daily_project_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    usage_date DATE NOT NULL,
    session_count BIGINT NOT NULL DEFAULT 0,
    token_count BIGINT NOT NULL DEFAULT 0,
    cost NUMERIC(18,8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, project_name, usage_date)
);
```

#### `api_keys`
Machine-to-machine authentication keys.

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'write',      -- 'read', 'write', 'admin'
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);
```

#### `refresh_tokens`
User session refresh tokens.

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Schema Changes

#### `users` table
Added `role` column for role-based access control.

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
-- 'user', 'org_admin'
```

### Indexes Created

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `aggregation_runs` | `idx_aggregation_runs_org_id` | `organization_id` | Org aggregation lookup |
| `aggregation_runs` | `idx_aggregation_runs_status` | `status` | Filter by status |
| `aggregation_runs` | `idx_aggregation_runs_started_at` | `started_at` | Time-range queries |
| `aggregation_runs` | `idx_aggregation_runs_type` | `aggregation_type` | Filter by type |
| `daily_usage` | `idx_daily_usage_org_id` | `organization_id` | Org usage lookup |
| `daily_usage` | `idx_daily_usage_usage_date` | `usage_date` | Date-range queries |
| `daily_usage` | `idx_daily_usage_org_date` | `(organization_id, usage_date)` | Composite lookup |
| `daily_provider_usage` | `idx_daily_provider_usage_org_id` | `organization_id` | Org provider lookup |
| `daily_provider_usage` | `idx_daily_provider_usage_provider_id` | `provider_id` | Provider filter |
| `daily_provider_usage` | `idx_daily_provider_usage_org_provider_date` | `(organization_id, provider_id, usage_date)` | Composite lookup |
| `daily_model_usage` | `idx_daily_model_usage_org_id` | `organization_id` | Org model lookup |
| `daily_model_usage` | `idx_daily_model_usage_org_model_date` | `(organization_id, model, usage_date)` | Composite lookup |
| `daily_user_usage` | `idx_daily_user_usage_org_id` | `organization_id` | Org user lookup |
| `daily_user_usage` | `idx_daily_user_usage_org_user_date` | `(organization_id, user_id, usage_date)` | Composite lookup |
| `daily_project_usage` | `idx_daily_project_usage_org_id` | `organization_id` | Org project lookup |
| `daily_project_usage` | `idx_daily_project_usage_org_project_date` | `(organization_id, project_name, usage_date)` | Composite lookup |
| `api_keys` | `idx_api_keys_org_id` | `organization_id` | Org key lookup |
| `api_keys` | `idx_api_keys_prefix` | `prefix` | Key lookup by prefix |
| `api_keys` | `idx_api_keys_expires_at` | `expires_at` | Expired key cleanup |
| `refresh_tokens` | `idx_refresh_tokens_user_id` | `user_id` | User token lookup |
| `refresh_tokens` | `idx_refresh_tokens_expires_at` | `expires_at` | Expired token cleanup |
| `users` | `idx_users_role` | `role` | Role-based queries |

### ER Diagram

```mermaid
erDiagram
    organizations ||--o{ daily_usage : has
    organizations ||--o{ daily_provider_usage : has
    organizations ||--o{ daily_model_usage : has
    organizations ||--o{ daily_user_usage : has
    organizations ||--o{ daily_project_usage : has
    organizations ||--o{ aggregation_runs : has
    organizations ||--o{ api_keys : has
    users ||--o{ daily_user_usage : has
    users ||--o{ refresh_tokens : has
    providers ||--o{ daily_provider_usage : categorized_by

    daily_usage {
        uuid id PK
        uuid organization_id FK
        date usage_date
        bigint total_sessions
        bigint total_users
        bigint total_input_tokens
        bigint total_output_tokens
        bigint total_tokens
        numeric total_cost
    }

    daily_provider_usage {
        uuid id PK
        uuid organization_id FK
        smallint provider_id FK
        date usage_date
        bigint total_sessions
        bigint total_tokens
        numeric total_cost
    }

    daily_model_usage {
        uuid id PK
        uuid organization_id FK
        text model
        date usage_date
        bigint total_tokens
        numeric total_cost
        bigint session_count
    }

    daily_user_usage {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        date usage_date
        bigint session_count
        bigint token_count
        numeric cost
    }

    daily_project_usage {
        uuid id PK
        uuid organization_id FK
        text project_name
        date usage_date
        bigint session_count
        bigint token_count
        numeric cost
    }

    aggregation_runs {
        uuid id PK
        uuid organization_id FK
        text aggregation_type
        timestamptz started_at
        timestamptz completed_at
        text status
        bigint records_processed
        text error_message
    }

    api_keys {
        uuid id PK
        uuid organization_id FK
        text name
        text key_hash
        text prefix
        text role
        timestamptz expires_at
        timestamptz last_used_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        text token_hash
        timestamptz expires_at
    }
```

### Aggregation Strategy

**Idempotent Upserts:**
All aggregation tables use `ON CONFLICT ... DO UPDATE` for safe reruns:

```sql
INSERT INTO daily_usage (organization_id, usage_date, total_sessions, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (organization_id, usage_date)
DO UPDATE SET
  total_sessions = EXCLUDED.total_sessions,
  total_users = EXCLUDED.total_users,
  total_tokens = EXCLUDED.total_tokens,
  total_cost = EXCLUDED.total_cost
```

**Aggregation Pattern:**
1. Query raw `events` table for a specific date + organization
2. JOIN with `sessions` to get provider_id and user_id
3. GROUP BY the relevant dimension (provider, model, user, project)
4. UPSERT into the corresponding summary table

**Code Reference:** `packages/analytics-engine/src/repositories/analytics.repository.ts`

---

## 6. API Documentation

### Dashboard Endpoints

All dashboard endpoints require authentication (JWT or API key).

#### GET /api/v1/dashboard/overview

**Purpose:** Get high-level usage summary for a period

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | `24h \| 7d \| 30d \| 90d \| 1y` | `30d` | Time period |

**Response (200):**
```json
{
  "totalSessions": 1234,
  "totalUsers": 15,
  "totalTokens": 56789012,
  "totalCost": 1234.56,
  "activeProviders": 4,
  "periodStart": "2026-05-13T00:00:00.000Z",
  "periodEnd": "2026-06-12T23:59:59.999Z"
}
```

#### GET /api/v1/dashboard/providers

**Purpose:** Get per-provider usage breakdown

**Query Parameters:** Same as overview

**Response (200):**
```json
[
  {
    "providerId": 1,
    "providerName": "claude",
    "totalSessions": 500,
    "totalTokens": 25000000,
    "totalCost": 750.00,
    "percentageOfTotal": 60.7
  },
  {
    "providerId": 2,
    "providerName": "codex",
    "totalSessions": 300,
    "totalTokens": 15000000,
    "totalCost": 300.00,
    "percentageOfTotal": 24.3
  }
]
```

#### GET /api/v1/dashboard/models

**Purpose:** Get per-model usage breakdown

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | `24h \| 7d \| 30d \| 90d \| 1y` | `30d` | Time period |
| `limit` | `1-100` | `20` | Max results |

**Response (200):**
```json
[
  {
    "model": "claude-opus-4-5",
    "totalTokens": 10000000,
    "totalCost": 500.00,
    "sessionCount": 200,
    "percentageOfTotal": 40.5
  }
]
```

#### GET /api/v1/dashboard/users

**Purpose:** Get per-user usage breakdown

**Query Parameters:** Same as models

**Response (200):**
```json
[
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userEmail": "dev@example.com",
    "userName": "Jane Developer",
    "sessionCount": 150,
    "tokenCount": 8000000,
    "cost": 250.00
  }
]
```

#### GET /api/v1/dashboard/projects

**Purpose:** Get per-project usage breakdown

**Query Parameters:** Same as models

**Response (200):**
```json
[
  {
    "projectName": "my-api-service",
    "sessionCount": 100,
    "tokenCount": 5000000,
    "cost": 150.00
  }
]
```

#### GET /api/v1/dashboard/trends

**Purpose:** Get usage trends over time

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | `24h \| 7d \| 30d \| 90d \| 1y` | `30d` | Time period |
| `granularity` | `daily \| weekly \| monthly` | `daily` | Data granularity |

**Response (200):**
```json
{
  "granularity": "daily",
  "data": [
    {
      "date": "2026-06-01",
      "sessions": 45,
      "users": 8,
      "tokens": 2500000,
      "cost": 75.00
    }
  ],
  "periodStart": "2026-05-13T00:00:00.000Z",
  "periodEnd": "2026-06-12T23:59:59.999Z"
}
```

#### POST /api/v1/dashboard/backfill

**Purpose:** Trigger historical data backfill (admin only)

**Authorization:** Requires `org_admin` role

**Response (200):**
```json
{
  "message": "Backfill completed",
  "result": {
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "totalDays": 90,
    "processedDays": 85,
    "failedDays": 5,
    "errors": ["2026-04-01: timeout", "2026-04-02: timeout"],
    "durationMs": 45000
  }
}
```

### Auth Endpoints

#### POST /api/v1/auth/login

**Purpose:** Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "dev@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "dev@example.com",
    "name": "Jane Developer",
    "organizationId": "org_123",
    "role": "user"
  }
}
```

**Error Scenarios:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `Email and password are required` | Missing fields |
| 401 | `Invalid credentials` | Wrong email or password |
| 500 | `Internal server error` | Unexpected error |

#### POST /api/v1/auth/refresh

**Purpose:** Refresh JWT token

**Authorization:** Bearer JWT required

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "dev@example.com",
    "name": "Jane Developer",
    "organizationId": "org_123",
    "role": "user"
  }
}
```

### Health Endpoints

#### GET /api/v1/health

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-06-12T12:00:00.000Z"
}
```

#### GET /api/v1/version

**Response (200):**
```json
{
  "version": "0.2.0",
  "name": "aiinsight-dashboard-api"
}
```

---

## 7. Authentication Design

### Dual Authentication Scheme

The Dashboard API supports two authentication methods:

#### JWT Tokens
- **Use case:** Web dashboard users
- **Expiry:** 24 hours
- **Payload:** `{ sub, email, name, orgId, role }`
- **Header:** `Authorization: Bearer <jwt>`

#### API Keys
- **Use case:** Machine-to-machine (sync engine, CLI)
- **Prefix:** `cb_` (first 8 characters stored for lookup)
- **Hash:** bcrypt hash stored in database
- **Header:** `Authorization: Bearer cb_<key>` or `X-API-Key cb_<key>`

### Authentication Flow

```mermaid
sequenceDiagram
    participant DW as Dashboard Web
    participant DA as Dashboard API
    participant DB as PostgreSQL

    Note over DW,DA: Login Flow
    DW->>DA: POST /api/v1/auth/login {email, password}
    DA->>DB: SELECT user WHERE email = ?
    DA->>DA: bcrypt.compare(password, user.password_hash)
    DA->>DA: signToken(user)
    DA-->>DW: {token, user}

    Note over DW,DA: Dashboard Request
    DW->>DA: GET /api/v1/dashboard/overview
    DA->>DA: authMiddleware.verify(token)
    DA->>DB: SELECT user WHERE id = token.sub
    DA->>DB: SELECT FROM daily_usage WHERE organization_id = ?
    DA-->>DW: DashboardOverview
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `user` | View dashboard, query analytics |
| `org_admin` | All user permissions + trigger backfill, manage API keys |

**Code Reference:** `apps/dashboard-api/src/middlewares/auth.middleware.ts`

---

## 8. Aggregation Jobs

### Daily Aggregation Job

**Trigger:** Runs hourly (cron or scheduled)
**Scope:** Processes yesterday's data for all organizations
**Duration:** Typically < 30 seconds per organization

**Flow:**
1. Query all distinct `organization_id` from `events` table
2. For each organization:
   - Run all 5 aggregators for yesterday's date
   - Each aggregator queries raw events and upserts into summary table
3. Log completion with record counts

**Code Reference:** `packages/analytics-engine/src/jobs/dailyAggregation.job.ts`

### Historical Backfill Job

**Trigger:** Manual trigger via `POST /api/v1/dashboard/backfill`
**Scope:** Processes all unaggregated dates for a single organization
**Duration:** Varies by data volume (typically 1-2 seconds per date)

**Flow:**
1. Find min/max date range from raw events
2. Query unaggregated dates (dates in `events` not in `daily_usage`)
3. For each date:
   - Start aggregation run record
   - Run all 5 aggregators
   - Complete aggregation run record
   - Log progress every 10 days
4. Return summary with success/failure counts

**Resume Capability:**
- Tracks progress in `aggregation_runs` table
- Can be safely restarted (idempotent upserts)
- Skips already-processed dates

**Code Reference:** `packages/analytics-engine/src/jobs/historicalBackfill.job.ts`

### Aggregator Pattern

All 5 aggregators follow the same pattern:

1. **Query raw events:** `SELECT FROM events WHERE organization_id = ? AND DATE(event_time) = ?`
2. **JOIN with sessions:** To get `provider_id`, `user_id`, `project_name`
3. **GROUP BY dimension:** Provider, model, user, or project
4. **UPSERT into summary table:** Using `ON CONFLICT ... DO UPDATE`

| Aggregator | Dimension | Source Tables | Target Table |
|------------|-----------|---------------|--------------|
| `dailyUsageAggregator` | Organization | `events` | `daily_usage` |
| `providerUsageAggregator` | Provider | `events` + `sessions` | `daily_provider_usage` |
| `modelUsageAggregator` | Model | `events` | `daily_model_usage` |
| `userUsageAggregator` | User | `events` + `sessions` | `daily_user_usage` |
| `projectUsageAggregator` | Project | `events` + `sessions` | `daily_project_usage` |

**Code Reference:** `packages/analytics-engine/src/aggregators/*.ts`

---

## 9. Dashboard Web

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.0.0 | React framework |
| React | 19.0.0 | UI library |
| TanStack Query | 5.60.0 | Data fetching & caching |
| Recharts | 2.13.0 | Chart components |
| Tailwind CSS | 3.4.0 | Styling |
| Zod | 3.25.76 | Schema validation |
| React Hook Form | 7.53.0 | Form handling |
| Lucide React | 0.460.0 | Icons |

### Pages

| Route | Page | Content |
|-------|------|---------|
| `/` | Overview | 4 stat cards, provider pie chart, daily cost trend |
| `/providers` | Providers | Provider distribution charts, detailed table |
| `/models` | Models | Model usage table (top 20) |
| `/users` | Users | User usage table (top 20) |
| `/projects` | Projects | Project usage table (top 20) |
| `/trends` | Trends | Time series charts with granularity selector |
| `/login` | Login | Email/password authentication form |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardShell` | `components/DashboardShell.tsx` | Layout with navigation sidebar |
| `PeriodSelector` | `components/PeriodSelector.tsx` | Period dropdown (24h, 7d, 30d, 90d, 1y) |
| `BarChart` | `components/charts/BarChart.tsx` | Horizontal/vertical bar chart |
| `ProviderChart` | `components/charts/ProviderChart.tsx` | Pie chart for provider distribution |
| `TrendChart` | `components/charts/TrendChart.tsx` | Line chart for time series |

### Data Fetching

TanStack Query hooks with automatic caching:

| Hook | Query Key | Cache Time |
|------|-----------|------------|
| `useOverview(period)` | `['overview', period]` | 60 seconds |
| `useProviders(period)` | `['providers', period]` | 60 seconds |
| `useModels(period, limit)` | `['models', period, limit]` | 60 seconds |
| `useUsers(period, limit)` | `['users', period, limit]` | 60 seconds |
| `useProjects(period, limit)` | `['projects', period, limit]` | 60 seconds |
| `useTrends(period, granularity)` | `['trends', period, granularity]` | 60 seconds |

**Code Reference:** `apps/dashboard-web/src/hooks/useDashboard.ts`

---

## 10. Logging Strategy

### Logging Framework

- **Library:** Pino (high-performance JSON logger)
- **Configuration:** Per-package logger files
- **Level:** Configurable via `LOG_LEVEL` env var (default: `info`)

### Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Query details, cache hits, auth token verification |
| `info` | Aggregation start/complete, API requests, login success |
| `warn` | Slow queries, retry attempts, deprecated API usage |
| `error` | Aggregation failures, auth failures, database errors |

### Correlation IDs

Every request generates a `requestId` (UUID) attached to all log messages:

```typescript
const requestId = crypto.randomUUID();
const logger = createRequestLogger({
  requestId,
  organizationId: req.user?.organizationId,
  endpoint: req.path,
});
```

### Structured Context

| Logger | Context Fields |
|--------|----------------|
| `analyticsLogger` | `service: 'aiinsight-analytics-engine'` |
| `dashboardLogger` | `service: 'aiinsight-dashboard-api'` |
| `createAggregationLogger` | `operationId`, `organizationId`, `aggregationType` |
| `createRequestLogger` | `requestId`, `organizationId`, `endpoint`, `userId` |

### Example Logs

```json
{
  "level": "info",
  "time": "2026-06-12T12:00:00.000Z",
  "service": "aiinsight-analytics-engine",
  "operationId": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "org_123",
  "aggregationType": "daily",
  "event": "aggregation_complete",
  "recordsProcessed": 1500,
  "durationMs": 2500,
  "msg": "Daily aggregation completed"
}
```

```json
{
  "level": "info",
  "time": "2026-06-12T12:00:05.000Z",
  "service": "aiinsight-dashboard-api",
  "requestId": "req_abc123",
  "organizationId": "org_123",
  "endpoint": "/api/v1/dashboard/overview",
  "userId": "user_456",
  "event": "request_complete",
  "statusCode": 200,
  "durationMs": 45,
  "msg": "Dashboard request completed"
}
```

---

## 11. Security Considerations

### Authentication

**Implemented:**
- JWT tokens with 24-hour expiry
- API keys with bcrypt hashing
- Dual auth scheme (JWT for web, API keys for machine-to-machine)

**Not Implemented:**
- Token refresh rotation
- API key rotation
- Rate limiting per tenant

### Authorization

**Implemented:**
- Role-based access control (user, org_admin)
- Organization-scoped data isolation
- Admin-only endpoints (backfill trigger)

**Not Implemented:**
- Fine-grained permissions (read-only, write-only)
- API key scoping (specific endpoints)

### Tenant Isolation

**Implemented:**
- All queries filter by `organization_id`
- Cascade deletes ensure data cleanup
- JWT tokens include `orgId` for validation

**Not Implemented:**
- Row-level security (RLS) policies
- Schema-per-tenant isolation

### Sensitive Data Handling

**Stored in Plain Text:**
- User email and name
- API key prefix (first 8 characters)
- Usage data (sessions, tokens, costs)

**Hashed/Encrypted:**
- API keys (bcrypt)
- JWT tokens (signed with `JWT_SECRET`)
- User passwords (bcrypt)

**Not Stored:**
- Raw API keys (only hash stored)
- JWT token contents (verified, not stored)
- File contents (only metadata)

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `aiinsight-dev-secret...` | JWT signing secret |
| `PORT` | No | `3002` | API server port |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `NODE_ENV` | No | `development` | Environment mode |
| `NEXT_PUBLIC_API_URL` | No | `''` | Dashboard API base URL |

---

## 12. Technical Decisions

### Decision: Precomputed Aggregates (Not Raw Events)

**Alternatives Considered:**
1. Query raw `events` table directly
2. Use materialized views
3. Precomputed aggregate tables

**Why Chosen:**
- Raw event queries slow at scale (millions of rows)
- Aggregate tables provide sub-500ms response times
- Idempotent upserts enable safe reruns
- Separate tables per dimension enable targeted queries

**Tradeoffs:**
- Data latency (hourly aggregation delay)
- Storage overhead (duplicate data in summary tables)
- Complexity (aggregation jobs to maintain)

**Code Reference:** `packages/analytics-engine/src/aggregators/*.ts`

### Decision: JWT + API Key Dual Authentication

**Alternatives Considered:**
1. JWT only
2. API keys only
3. OAuth 2.0

**Why Chosen:**
- JWT for web dashboard (stateless, scalable)
- API keys for machine-to-machine (simple, no user interaction)
- Dual scheme supports both use cases without complexity

**Tradeoffs:**
- Two auth paths to maintain
- API key security (bcrypt hashing required)
- JWT expiry management

**Code Reference:** `apps/dashboard-api/src/middlewares/auth.middleware.ts`

### Decision: Next.js 15 + TanStack Query

**Alternatives Considered:**
1. React + Vite
2. Next.js 14 (Pages Router)
3. Remix

**Why Chosen:**
- Next.js 15 App Router for modern React patterns
- TanStack Query for automatic caching and background refetch
- Server-side rendering capability (future)
- Built-in API routes (future)

**Tradeoffs:**
- Heavier bundle than Vite
- Learning curve for App Router
- Server component complexity

**Code Reference:** `apps/dashboard-web/src/app/`

### Decision: Separate Analytics Bounded Context

**Alternatives Considered:**
1. Add analytics to Ingestion API
2. Separate package
3. Shared library

**Why Chosen:**
- Clear separation of concerns
- Independent scaling (analytics jobs vs API)
- Reusable across Dashboard API and future services
- No coupling to Ingestion API changes

**Tradeoffs:**
- Additional package to maintain
- Cross-package dependencies
- Build complexity

**Code Reference:** `packages/analytics-engine/`

### Decision: Idempotent Aggregation Jobs

**Alternatives Considered:**
1. Append-only (no updates)
2. Delete + insert
3. Upsert with ON CONFLICT

**Why Chosen:**
- Safe to rerun (idempotent)
- Handles failures gracefully
- No data loss on partial failures
- Resume capability for backfill

**Tradeoffs:**
- Slower than append-only
- Requires unique constraints
- More complex SQL

**Code Reference:** `packages/analytics-engine/src/repositories/analytics.repository.ts`

---

## 13. Known Limitations

### Current Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No ClickHouse | Slow analytical queries at scale | Phase 03 - add ClickHouse |
| Hourly aggregation delay | Data not real-time | Acceptable for dashboard use case |
| No rate limiting | DDoS vulnerability | Add rate limiting in Phase 03 |
| No data export | Cannot export CSV/JSON | Phase 03 - add export endpoints |
| No alerting | No cost threshold notifications | Phase 04 - billing integration |
| No mobile optimization | Desktop-only dashboard | Phase 05 - responsive design |
| No WebSocket updates | Manual refresh required | Phase 03 - add real-time updates |
| No row-level security | relies on app-level isolation | Phase 03 - add RLS policies |
| No API key rotation | Keys valid until manual revocation | Phase 03 - add rotation |
| No token refresh rotation | JWT valid for 24 hours | Phase 03 - add refresh flow |

### Technical Debt

1. **Duplicate Type Definitions:** Dashboard API and Analytics Engine define similar interfaces
   - **Recommendation:** Extract shared types to a types package

2. **Controller Logic:** Dashboard controller contains business logic
   - **Recommendation:** Extract to service layer (already done in Phase 2)

3. **No Error Codes:** API returns generic error messages
   - **Recommendation:** Implement error code enum

4. **No OpenAPI Spec:** Dashboard API lacks OpenAPI documentation
   - **Recommendation:** Add Swagger UI (Phase 03)

---

## 14. Future Work

### P0 (Next Sprint)

| Task | Description | Dependencies |
|------|-------------|--------------|
| ClickHouse integration | Fast analytical queries at scale | None |
| Rate limiting | Per-tenant request throttling | None |
| API key rotation | Automatic key rotation | None |
| Token refresh rotation | Short-lived access tokens | None |

### P1 (Next Quarter)

| Task | Description | Dependencies |
|------|-------------|--------------|
| Real-time updates | WebSocket for live dashboard | Authentication |
| Data export | CSV/JSON export endpoints | None |
| Alerting | Cost threshold notifications | None |
| Audit logging | Track data access | Authentication |
| OpenAPI documentation | Swagger UI for Dashboard API | None |

### P2 (Next Half)

| Task | Description | Dependencies |
|------|-------------|--------------|
| Mobile app | iOS/Android usage viewer | Analytics API |
| Billing integration | Usage-based billing | Analytics API |
| Multi-region deployment | Geographic distribution | Infrastructure |
| Slack/Teams integration | Cost alerts and reports | Billing |

---

## 15. Testing Coverage

### Unit Tests

| Package | Test Files | Coverage |
|---------|------------|----------|
| `@aiinsight/analytics-engine` | 0 | 0% |
| `@aiinsight/dashboard-api` | 0 | 0% |
| `@aiinsight/dashboard-web` | 0 | 0% |
| CLI (existing) | 89 files | ~75% |

### Integration Tests

| Test | Status |
|------|--------|
| End-to-end dashboard flow | Not implemented |
| API endpoint validation | Not implemented |
| Database migration tests | Not implemented |
| Authentication flow tests | Not implemented |

### Testing Gaps

1. No unit tests for analytics aggregators
2. No integration tests for dashboard API endpoints
3. No database migration tests
4. No authentication flow tests
5. No load testing for dashboard queries
6. No chaos testing for failure scenarios

---

## 16. Deployment Notes

### Required Services

| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 14+ | Primary data store |
| Node.js | 22.13.0+ | Runtime |
| TypeScript | 5.8+ | Build toolchain |

### Environment Setup

```bash
# 1. Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/aiinsight"

# 2. Set JWT_SECRET
export JWT_SECRET="your-secret-key-here"

# 3. Run migrations
cd apps/ingestion-api
npm run migrate

# 4. Start Dashboard API
cd apps/dashboard-api
npm run dev

# 5. Start Dashboard Web
cd apps/dashboard-web
npm run dev
```

### Database Requirements

1. PostgreSQL 14+ with UUID extension
2. All Phase 1 tables must exist (organizations, users, machines, sessions, events, providers)
3. Run migrations 004-010 to create aggregation and auth tables

### Migration Process

```bash
# 1. Verify Phase 1 tables exist
psql $DATABASE_URL -c "\dt"  # Should show Phase 1 tables

# 2. Run Phase 2 migrations
cd apps/ingestion-api
npm run migrate

# 3. Verify new tables
psql $DATABASE_URL -c "\dt"  # Should show daily_*, aggregation_runs, api_keys, refresh_tokens
```

### Rollback Strategy

**Current:** Manual rollback required

```bash
# 1. Drop tables in reverse order
psql $DATABASE_URL -c "DROP TABLE IF EXISTS refresh_tokens CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS api_keys CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS daily_project_usage CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS daily_user_usage CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS daily_model_usage CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS daily_provider_usage CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS daily_usage CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS aggregation_runs CASCADE;"

# 2. Remove role column from users
psql $DATABASE_URL -c "ALTER TABLE users DROP COLUMN IF EXISTS role;"

# 3. Remove migration records
psql $DATABASE_URL -c "DELETE FROM schema_migrations WHERE version >= '004';"
```

### Docker Deployment

The full analytics stack (dashboard API, dashboard web, PostgreSQL) can be deployed via Docker.

```bash
# Build and start all services
docker compose up --build -d

# Run migrations (first time)
docker compose exec ingestion-api node dist/database/migrate.js

# Check logs
docker compose logs -f dashboard-api dashboard-web
```

**Services started by Docker Compose:**

| Service | Port | Description |
|---------|------|-------------|
| `dashboard-web` | 3000 | Next.js frontend |
| `dashboard-api` | 3002 | Analytics REST API |
| `ingestion-api` | 3001 | Event ingestion API |
| `postgres` | 5432 | Shared PostgreSQL database |

Environment variables for the dashboard services:

| Variable | Docker Default | Description |
|----------|---------------|-------------|
| `DATABASE_URL` | `postgresql://aiinsight:aiinsight_secret@postgres:5432/aiinsight` | PostgreSQL connection string |
| `JWT_SECRET` | `change-this-in-production` | JWT signing secret |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3002` | Dashboard API URL for Next.js |

See `docker-compose.yml` and `.env.docker.example` at the project root for the full configuration.

---

## 17. Lessons Learned

### Risks Discovered

1. **Aggregation Delay Risk:** Hourly aggregation means data is up to 1 hour stale
   - **Mitigation:** Acceptable for dashboard use case; real-time updates in Phase 03

2. **Type Duplication Risk:** Dashboard API and Analytics Engine define similar interfaces
   - **Mitigation:** Extract shared types to a types package in Phase 03

3. **Auth Complexity Risk:** Dual auth scheme adds maintenance burden
   - **Mitigation:** Well-documented, clear separation of concerns

### Technical Debt Introduced

1. **No tests:** Phase 2 packages have 0% test coverage
   - **Recommendation:** Add unit tests for aggregators and integration tests for API endpoints

2. **No OpenAPI spec:** Dashboard API lacks documentation
   - **Recommendation:** Add Swagger UI in Phase 03

3. **No error codes:** API returns generic error messages
   - **Recommendation:** Implement error code enum in Phase 03

### Refactoring Opportunities

1. **Extract shared types** to avoid duplication between packages
2. **Add OpenAPI documentation** for Dashboard API
3. **Implement error code enum** for consistent error handling
4. **Add integration tests** for authentication flow

### Scalability Concerns

1. **Single-threaded API:** Express is single-threaded
   - **Future:** Consider clustering or migration to Fastify

2. **No connection pooling configuration:** Default pg pool settings
   - **Future:** Tune pool size based on load testing

3. **No caching layer:** Every query hits database
   - **Future:** Add Redis for hot data caching

4. **Aggregation job performance:** May be slow with large event volumes
   - **Future:** Parallelize aggregation across dates

---

## 18. Seed Data System

### Overview

The seed data system generates realistic mock data for development, testing, and demonstrations. It uses a factory pattern to create consistent, interconnected data across all database tables.

### Architecture

```
apps/ingestion-api/src/seed/
├── seed.ts                    # Main seed orchestrator
├── factories/
│   ├── organization.factory.ts
│   ├── user.factory.ts
│   ├── machine.factory.ts
│   ├── session.factory.ts
│   └── event.factory.ts
```

### Factory Pattern

Each factory generates realistic data with proper relationships:

1. **Organization Factory**: Creates 1-3 organizations with realistic names
2. **User Factory**: Generates users per organization with email addresses
3. **Machine Factory**: Creates machines linked to users
4. **Session Factory**: Generates AI coding sessions with provider metadata
5. **Event Factory**: Creates token usage events within sessions

### Seed Sizes

| Size | Events | Users/Org | Machines/User | Sessions/User |
|------|--------|-----------|---------------|---------------|
| `small` | ~10,000 | 25 | 1 | ~4 |
| `medium` | ~100,000 | 75 | 2 | ~13 |
| `large` | ~1,000,000 | 150 | 2 | ~44 |

### Provider-Specific Seeds

The seed system generates realistic data for each supported provider:

- **Claude**: Opus, Sonnet, Haiku model distribution
- **Codex**: GPT-4o, GPT-4 Turbo usage patterns
- **Cursor**: Auto-mode with Sonnet estimation
- **Gemini**: Pro model usage
- **Others**: Generic provider data

### Demo Mode

Demo mode creates curated data with:
- 30+ days of historical data
- Multiple team members with varying usage
- Cost spikes and trends
- Error patterns and recovery scenarios
- Model performance variations

### Commands

```bash
# Basic seeding
pnpm seed                    # Medium size (default)
pnpm seed:small              # Small dataset
pnpm seed:medium             # Medium dataset
pnpm seed:large              # Large dataset
pnpm seed:demo               # Demo mode

# With reset
pnpm seed --reset            # Truncate existing data first
pnpm seed:large --reset      # Full reset with large dataset
```

---

## 19. Dashboard UX Redesign

### Overview

The Phase 2 dashboard underwent a comprehensive UX redesign to improve data accessibility, visual hierarchy, and user experience.

### New Component Library

The dashboard introduced a complete component library:

#### UI Components

| Component | Purpose |
|-----------|---------|
| `MetricCard` | Hero metrics with trend indicators and sparklines |
| `InsightCard` | Compact insight display for secondary metrics |
| `Badge` | Status and category indicators (6 variants) |
| `Skeleton` | Loading states with shimmer animation |
| `DataTable` | Sortable, paginated data tables |
| `EmptyState` | Helpful empty state messages |
| `Card` | Base, elevated, and interactive variants |

#### Chart Components

| Component | Purpose |
|-----------|---------|
| `AreaChart` | Gradient-filled time-series charts |
| `BarChart` | Categorical comparisons with stacked mode |
| `DonutChart` | Distribution visualization with center text |
| `LineChart` | Multi-series trend lines |
| `StackedBarChart` | Composition analysis with totals |
| `HeatmapChart` | GitHub-style activity grids |
| `SparkLine` | Inline mini charts for tables |
| `ChartTooltip` | Shared tooltip component |

### Design System Changes

#### Color System

- **Primary**: Indigo-based (`234 86% 62%`)
- **Chart Colors**: 7 distinct colors for data visualization
- **Status Colors**: Success (green), Warning (amber), Info (blue), Destructive (red)
- **Provider Colors**: Unique colors for Claude, Codex, Cursor, Gemini, Warp, OpenCode

#### Dark Mode

- Deep navy backgrounds (not pure black)
- Full CSS variable support
- Theme persistence via localStorage
- System preference detection
- Toggle in sidebar

#### Typography

- **Sans-serif**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for code/data)
- **Scale**: 12px to 24px (8 steps)

#### Spacing & Layout

- **Sidebar**: 240px expanded, 64px collapsed
- **TopBar**: 56px fixed height
- **Content**: Flexible with 24px padding
- **Card Gap**: 16px to 24px

### Animation System

- **Transitions**: 150ms to 500ms with cubic-bezier easing
- **Keyframes**: fade-in, slide-up, shimmer, pulse-glow
- **Stagger**: Children animate sequentially (50ms delay per child)

### Accessibility

- Focus ring visible on all interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast ratios

### Performance

- Code splitting per page
- Image optimization
- Skeleton loading states
- Lazy loading for off-screen content

---

*Document generated: 2026-06-13*
*Phase: 02 - Analytics & Dashboard Foundation*
*Status: Implementation Complete*