# Repository Structure

## Top-Level Layout

```
aiinsight/
├── apps/                    # Deployable applications
│   ├── dashboard-api/       # Backend API for dashboard
│   ├── dashboard-web/       # Next.js frontend
│   └── ingestion-api/       # Data ingestion API
├── packages/                # Shared libraries
│   ├── sync-engine/         # Core sync logic
│   └── analytics-engine/    # Analytics aggregation
├── src/                     # CLI entry point (OSS agent)
├── tests/                   # Integration tests
├── docs/                    # Documentation
├── scripts/                 # Build and dev scripts
├── assets/                  # Static assets
├── gnome/                   # GNOME integration
├── mac/                     # macOS integration
└── package.json             # Workspace root
```

---

## apps/dashboard-api

**Purpose**: Backend API for the web dashboard. Handles authentication, organization management, invitations, analytics queries, agent management, and session/machine detail endpoints.

```
apps/dashboard-api/src/
├── index.ts                 # Express app entry point
├── controllers/             # Route handlers
│   ├── auth.controller.ts       # Login, register, refresh, password reset
│   ├── dashboard.controller.ts  # Analytics queries
│   ├── session.controller.ts    # Session list and detail
│   ├── machine.controller.ts    # Machine detail
│   ├── apiKey.controller.ts     # API key CRUD
│   ├── invitation.controller.ts # Invitation flow
│   ├── enrollment.controller.ts # Enrollment key management
│   ├── agent.controller.ts      # Agent registration and heartbeat
│   ├── organization.controller.ts # Org management
│   ├── team.controller.ts       # Team management
│   └── onboarding.controller.ts # Onboarding progress
├── services/                # Business logic
│   ├── dashboard.service.ts     # Core auth, org, invitation, API key logic
│   ├── session.service.ts       # Session queries
│   └── machine.service.ts       # Machine queries
├── repositories/            # Database queries
│   ├── dashboard.repository.ts  # All dashboard DB queries
│   └── session.repository.ts    # Session-specific queries
├── routes/                  # Express route definitions
├── middlewares/              # Auth, rate limiting
├── jobs/                    # Background tasks
│   └── offlineDetection.ts      # Marks machines offline after 5 min
├── database/                # Connection pool
├── validators/              # Zod validation schemas
├── types/                   # TypeScript types
└── logging/                 # Pino logger setup
```

**Port**: 3002

---

## apps/dashboard-web

**Purpose**: Next.js 15 frontend for viewing analytics, managing settings, and onboarding.

```
apps/dashboard-web/src/
├── app/                     # Next.js App Router pages
│   ├── dashboard/               # Overview page
│   ├── sessions/                # Session list
│   ├── sessions/[id]/           # Session detail
│   ├── users/                   # User analytics
│   ├── machines/[id]/           # Machine detail
│   ├── providers/               # Provider analytics
│   ├── models/                  # Model analytics
│   ├── projects/                # Project analytics
│   ├── trends/                  # Trend charts
│   ├── settings/                # Settings page
│   ├── settings/agents/         # Agent setup
│   ├── login/                   # Login page
│   ├── register/                # Register page
│   ├── forgot-password/         # Password reset request
│   └── reset-password/          # Password reset form
├── components/              # React components
│   ├── layout/                  # Sidebar, PageShell
│   └── pages/                   # Page components
├── hooks/                   # React hooks
├── lib/                     # API client, utilities
│   └── api.ts                   # Dashboard API client
└── types/                   # TypeScript types
    └── dashboard.ts             # Frontend type definitions
```

**Port**: 3000

---

## apps/ingestion-api

**Purpose**: Data ingestion API. Receives batch uploads from sync engines, validates, normalizes, and stores in PostgreSQL.

```
apps/ingestion-api/src/
├── index.ts                 # Express app entry point
├── controllers/
│   └── ingestion.controller.ts  # Batch, sessions, events ingestion
├── services/
│   └── ingestion.service.ts     # Normalization and storage logic
├── repositories/
│   └── ingestion.repository.ts  # DB insert queries
├── routes/
│   ├── ingestion.routes.ts      # /api/v1/ingest/* routes
│   ├── health.route.ts          # Health check
│   └── openapi.route.ts         # OpenAPI spec
├── middlewares/
│   ├── auth.middleware.ts        # JWT + ai_ API key auth
│   └── rateLimit.middleware.ts   # 1000 req/min
├── database/
│   ├── pool.ts                  # PostgreSQL connection pool
│   └── migrations/              # 14 SQL migration files
├── validators/
│   └── ingestion.validator.ts   # Zod schemas for batch/sessions/events
├── seed/                       # Demo data seeder
└── logging/                    # Pino logger setup
```

**Port**: 3001

---

## packages/sync-engine

**Purpose**: Core sync logic. Provider adapters, parsers, batch uploader, and state management.

```
packages/sync-engine/src/
├── index.ts                 # Package exports
├── providers/               # Provider adapters
│   ├── oss-types.ts             # Provider/Session/Event types
│   ├── index.ts                 # Adapter registry
│   ├── claude.sync.ts           # Claude adapter
│   ├── codex.sync.ts            # Codex adapter
│   ├── cursor.sync.ts           # Cursor adapter
│   └── gemini.sync.ts           # Gemini adapter
├── services/
│   ├── historicalSync.service.ts    # Full historical sync
│   └── incrementalSync.service.ts   # Watermark-based incremental sync
├── uploader/
│   └── batchUploader.ts        # Batch upload with retry + queue
├── state/
│   └── syncState.repository.ts  # Local JSON file state persistence
├── types/
│   └── sync.types.ts            # SyncConfig, SyncSession, SyncEvent
├── scheduler/                # Sync scheduling (placeholder)
├── api-client/               # API client for ingestion
└── logging/
    └── sync.logger.ts           # Structured sync logging
```

---

## packages/analytics-engine

**Purpose**: Analytics aggregation queries. Runs daily aggregation and historical backfill.

```
packages/analytics-engine/src/
├── index.ts                 # createAnalyticsService()
├── services/
│   └── analytics.service.ts     # Aggregation logic
├── repositories/
│   └── aggregation.repository.ts # DB aggregation queries
└── types/                   # Analytics types
```

---

## src/ (Root)

**Purpose**: CLI entry point for the open-source agent. Provides `aiinsight init`, `aiinsight sync`, and `aiinsight status` commands.

```
src/
├── cli.ts                   # Commander.js CLI
├── commands/                # CLI commands
├── providers/               # OSS provider parsers (shared with sync-engine)
└── config/                  # Config management
```

---

## tests/

**Purpose**: Integration tests for beta blockers.

```
tests/
└── beta-blockers.test.ts    # 28 tests covering auth, API keys, invitations, rate limiting
```
