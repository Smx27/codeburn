# Shared Packages

Documentation for shared packages in the AIInsight monorepo.

## Overview

AIInsight has two shared packages:

1. **sync-engine** — Client-side sync library
2. **analytics-engine** — Aggregation library

## sync-engine

### Purpose

Client-side library that discovers, parses, and uploads provider session data to the cloud ingestion API.

### Installation

```bash
npm install @aiinsight/sync-engine
```

### Usage

```typescript
import { SyncEngine } from '@aiinsight/sync-engine'

const engine = new SyncEngine({
  apiUrl: 'http://localhost:3001',
  apiKey: 'aisk_...',
  organizationId: 'org_...',
  machineId: 'mach_...',
})

// Run sync
const result = await engine.sync()
console.log(`Synced ${result.sessionsUploaded} sessions`)
```

### Configuration

```typescript
interface SyncConfig {
  apiUrl: string
  apiKey: string
  organizationId: string
  machineId: string
  syncInterval?: number // Default: 300 seconds
  providers?: string[]  // Default: all detected
}
```

### Features

- Discovers sessions from provider directories
- Batches events for upload with queue persistence
- Exponential backoff retry logic
- Historical + incremental sync loop
- File-based state tracking

### API

```typescript
class SyncEngine {
  constructor(config: SyncConfig)
  
  // Run a single sync
  sync(): Promise<SyncResult>
  
  // Run continuous sync loop
  startContinuous(): Promise<void>
  
  // Stop continuous sync
  stop(): void
}

interface SyncResult {
  sessionsUploaded: number
  eventsUploaded: number
  errors: string[]
}
```

## analytics-engine

### Purpose

Core aggregation library that computes daily usage summaries from raw events.

### Installation

```bash
npm install @aiinsight/analytics-engine
```

### Usage

```typescript
import { AnalyticsEngine } from '@aiinsight/analytics-engine'

const engine = new AnalyticsEngine({
  databaseUrl: 'postgresql://...',
})

// Run hourly aggregation
await engine.runHourlyAggregation()

// Run historical backfill
await engine.runHistoricalBackfill(startDate, endDate)
```

### Configuration

```typescript
interface AnalyticsConfig {
  databaseUrl: string
  logLevel?: string // Default: 'info'
}
```

### Features

- 5 aggregation jobs:
  - `daily_usage` — Org-level daily summary
  - `daily_provider_usage` — Per-provider daily summary
  - `daily_model_usage` — Per-model daily summary
  - `daily_user_usage` — Per-user daily summary
  - `daily_project_usage` — Per-project daily summary
- Hourly incremental updates (yesterday's data)
- Historical backfill on demand
- Idempotent upserts (ON CONFLICT DO UPDATE)
- Resume capability via aggregation_runs table

### API

```typescript
class AnalyticsEngine {
  constructor(config: AnalyticsConfig)
  
  // Run hourly aggregation for yesterday
  runHourlyAggregation(): Promise<void>
  
  // Run historical backfill
  runHistoricalBackfill(start: Date, end: Date): Promise<void>
  
  // Get aggregation status
  getStatus(): Promise<AggregationStatus>
}
```

## Package Dependencies

```
sync-engine → analytics-engine (optional)
sync-engine → ingestion-api (HTTP client)
analytics-engine → PostgreSQL (direct connection)
```

## Development

### Building

```bash
# Build sync-engine
npm run sync:build

# Build analytics-engine
npm run analytics:build
```

### Testing

```bash
# Test sync-engine
npm test -- packages/sync-engine

# Test analytics-engine
npm test -- packages/analytics-engine
```

## Related Documentation

- [Repository Structure](repository-structure.md) — Package details
- [Architecture](../architecture/overview.md) — System design
- [Setup](setup.md) — Local development setup
