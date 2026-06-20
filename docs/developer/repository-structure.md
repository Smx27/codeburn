# Repository Structure

Detailed description of the AIInsight monorepo packages.

## Overview

AIInsight is organized as a monorepo with npm workspaces:

```
aiinsight/
├── apps/                    # Application packages
│   ├── ingestion-api/       # Data ingestion REST API
│   ├── dashboard-api/       # Analytics + auth REST API
│   └── dashboard-web/       # Next.js frontend
├── packages/                # Shared libraries
│   ├── sync-engine/         # Client-side sync library
│   └── analytics-engine/    # Aggregation library
├── src/                     # CLI source (OSS)
├── tests/                   # Test suites
├── docs/                    # Documentation
├── scripts/                 # Build and dev scripts
├── mac/                     # macOS menubar app (Swift)
├── gnome/                   # GNOME extension (JavaScript)
└── dist/                    # Build output
```

## Apps

### ingestion-api

Multi-tenant REST API that receives, validates, deduplicates, and stores usage events in PostgreSQL.

**Port:** 3001

**Key Files:**
```
apps/ingestion-api/src/
├── index.ts                    # Express app setup
├── controllers/
│   └── ingestion.controller.ts # Request handlers
├── database/
│   ├── pool.ts                 # PostgreSQL connection pool
│   ├── migrate.ts              # Migration runner
│   └── migrations/             # SQL migration files
├── middlewares/
│   └── auth.middleware.ts      # Agent auth
├── repositories/               # Data access layer
├── routes/
│   ├── health.route.ts
│   ├── ingestion.routes.ts
│   └── openapi.route.ts
└── validators/
    └── ingestion.validator.ts  # Zod schemas
```

### dashboard-api

Express REST API serving pre-aggregated analytics data with JWT and API key authentication.

**Port:** 3002

**Key Files:**
```
apps/dashboard-api/src/
├── index.ts                         # Express app setup
├── controllers/
│   └── dashboard.controller.ts      # Request handlers
├── database/
│   └── pool.ts                      # PostgreSQL connection pool
├── middlewares/
│   └── auth.middleware.ts           # JWT + API key auth
├── repositories/
│   └── dashboard.repository.ts      # Read-only aggregate queries
├── routes/
│   ├── auth.routes.ts               # Login/refresh endpoints
│   ├── dashboard.routes.ts          # Dashboard endpoints
│   ├── organization.routes.ts       # Organization management
│   ├── team.routes.ts               # Team management
│   ├── invitation.routes.ts         # Invitation system
│   ├── enrollment.routes.ts         # Enrollment keys
│   ├── agent.routes.ts              # Agent management
│   └── health.route.ts              # Health check
├── services/
│   └── dashboard.service.ts         # Business logic
└── validators/
    └── query.validator.ts           # Zod schemas
```

### dashboard-web

Next.js 15 frontend for analytics visualization.

**Port:** 3000

**Key Files:**
```
apps/dashboard-web/src/
├── app/
│   ├── layout.tsx                   # Root layout with providers
│   ├── page.tsx                     # Landing page
│   ├── login/page.tsx               # Login page
│   ├── register/page.tsx            # Registration page
│   ├── dashboard/page.tsx           # Overview dashboard
│   ├── providers/page.tsx           # Provider analytics
│   ├── models/page.tsx              # Model analytics
│   ├── users/page.tsx               # User analytics
│   ├── projects/page.tsx            # Project analytics
│   ├── trends/page.tsx              # Usage trends
│   └── settings/page.tsx            # Organization settings
├── components/
│   ├── DashboardShell.tsx           # Layout with nav
│   ├── pages/                       # Page components
│   ├── ui/                          # Card, Select primitives
│   └── charts/                      # Recharts components
├── hooks/
│   └── useDashboard.ts             # TanStack Query hooks
├── lib/
│   ├── api.ts                       # API client
│   └── auth-context.tsx            # Auth React context
└── types/
    └── dashboard.ts                 # TypeScript interfaces
```

## Packages

### sync-engine

Client-side library that discovers, parses, and uploads provider session data to the cloud ingestion API.

**Key Features:**
- Discovers sessions from provider directories
- Batches events for upload with queue persistence
- Exponential backoff retry logic
- Historical + incremental sync loop
- File-based state tracking

**Key Files:**
```
packages/sync-engine/src/
├── index.ts                    # SyncEngine class, exports
├── api-client/
│   └── ingestion.client.ts     # HTTP client for API calls
├── providers/
│   ├── index.ts                # Adapter registry
│   ├── claude.sync.ts          # Claude adapter
│   ├── codex.sync.ts           # Codex adapter
│   ├── cursor.sync.ts          # Cursor adapter
│   └── gemini.sync.ts          # Gemini adapter
├── scheduler/
│   └── syncLoop.ts             # Historical + incremental loop
├── services/
│   ├── historicalSync.service.ts
│   └── incrementalSync.service.ts
├── state/
│   └── syncState.repository.ts # Local file-based state
├── types/
│   └── sync.types.ts           # All TypeScript interfaces
└── uploader/
    └── batchUploader.ts        # Queue + retry + HTTP upload
```

### analytics-engine

Core aggregation library that computes daily usage summaries from raw events.

**Key Features:**
- Hourly incremental updates (yesterday's data)
- Historical backfill on demand
- Idempotent upserts (ON CONFLICT DO UPDATE)
- Resume capability via aggregation_runs table

**Key Files:**
```
packages/analytics-engine/src/
├── index.ts                         # Public exports
├── aggregators/
│   ├── dailyUsageAggregator.ts      # Org-level daily summary
│   ├── providerUsageAggregator.ts   # Per-provider daily summary
│   ├── modelUsageAggregator.ts      # Per-model daily summary
│   ├── userUsageAggregator.ts       # Per-user daily summary
│   └── projectUsageAggregator.ts    # Per-project daily summary
├── jobs/
│   ├── dailyAggregation.job.ts      # Hourly aggregation for yesterday
│   └── historicalBackfill.job.ts    # Backfill historical data
├── repositories/
│   └── analytics.repository.ts      # Database queries
├── services/
│   └── analytics.service.ts         # Service facade
└── types/
    └── analytics.types.ts           # TypeScript interfaces
```

## CLI (src/)

Commander.js + Ink (React for terminals) command-line interface.

**Key Files:**
```
src/
├── cli.ts                        # Entry point
├── main.ts                       # Command definitions
├── commands/
│   ├── login.ts                  # Login command
│   ├── logout.ts                 # Logout command
│   ├── config.ts                 # Config command
│   └── providers.ts              # Providers command
├── providers/                    # Provider adapters
├── parser.ts                     # Session parsing
├── config.ts                     # Configuration management
├── currency.ts                   # Currency conversion
├── models.ts                     # Model pricing
├── optimize.ts                   # Waste detectors
├── ui/                           # Terminal UI components
└── data/                         # Pricing data
```

## Tests

```
tests/
├── providers/                    # Provider-specific tests
│   ├── codex.test.ts
│   ├── cursor.test.ts
│   └── ...
├── sync-engine/                  # Sync engine tests
├── analytics-engine/             # Analytics engine tests
├── dashboard-api/                # API tests
└── integration/                  # Integration tests
```

## Scripts

```
scripts/
├── seeds/
│   └── seed-dev-org.ts          # Development seed data
├── dev/
│   └── setup-org.ts             # Development setup
└── build/
    └── bundle-litellm.ts        # Pricing snapshot bundler
```

## Related Documentation

- [Setup](setup.md) — Local development setup
- [Architecture](../architecture/overview.md) — System design
- [Configuration](../architecture/configuration.md) — Environment variables
