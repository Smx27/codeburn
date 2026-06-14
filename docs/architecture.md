# AiInsight Architecture

A map of the codebase. Read this once before opening a non-trivial PR.

## Three Surfaces

AiInsight is one Node.js CLI plus two GUI clients that shell out to it.

```
+----------------------+      +-----------------+
| mac/  (Swift)        | ---> |                 |
+----------------------+      |  src/cli.ts     |
| gnome/ (JavaScript)  | ---> |  (the CLI)      |
+----------------------+      |                 |
                              |  status         |
                              |  --format       |
                              |  menubar-json   |
                              +-----------------+
                                       |
                                       v
                          +----------------------------+
                          | session files on disk      |
                          | (JSONL, SQLite, protobuf)  |
                          +----------------------------+
```

The macOS menubar (`mac/`) and the GNOME extension (`gnome/`) both invoke `aiinsight status --format menubar-json --period <p>` and parse the JSON. They do not share code with the CLI; they only depend on its output contract.

## CLI (`src/`)

`src/cli.ts` is the Commander.js entry point. The bin field in `package.json` points at `dist/cli.js`. Twelve commands are registered:

| Command | Line | Purpose |
|---|---|---|
| `report` | 274 | Default. Interactive Ink TUI dashboard. |
| `status` | 358 | Compact text status, plus `--format menubar-json` for clients. |
| `today` | 524 | Today-only view of `report`. |
| `month` | 542 | Month-only view of `report`. |
| `export` | 560 | CSV or JSON dump of usage data. |
| `menubar` | 621 | Downloads and launches the macOS menubar bundle. |
| `currency` | 636 | Sets display currency. |
| `model-alias` | 687 | Maps an unknown model name to a known one for pricing. |
| `plan` | 737 | Configures a subscription plan for overage tracking. |
| `optimize` | 857 | Runs all 14 waste detectors. |
| `compare` | 870 | Compares two models side by side. |
| `yield` | 882 | Tracks which sessions shipped to main vs. were reverted (experimental). |

### Pipeline

```
provider.discoverSessions()
        |
        v
provider.createSessionParser(source, seenKeys)
        |
        v   yields ParsedProviderCall (see src/providers/types.ts)
        |
        v
src/parser.ts: parseAllSessions()
        |
        v   aggregates into ProjectSummary[]
        |
        v
src/daily-cache.ts: aggregate per day, persist
        |
        v
output formatter (Ink TUI, JSON, or menubar-json)
```

`src/parser.ts` is the central aggregator. Public exports: `parseAllSessions`, `filterProjectsByName`, `extractMcpInventory`. It owns the dedup `Set` (`seenKeys`) that is passed into every provider parser so a turn that surfaces in two providers (Claude logs vs. Cursor mirror, for instance) is counted once.

### Cache Layers

Three caches under `~/.cache/aiinsight/` (override with `AIINSIGHT_CACHE_DIR`):

| File | Owner | Invalidation |
|---|---|---|
| `codex-results.json` | `src/codex-cache.ts` | `mtimeMs + sizeBytes` per Codex `.jsonl`. |
| `cursor-results.json` | `src/cursor-cache.ts` | `mtimeMs + sizeBytes` of the Cursor SQLite db. |
| `daily-cache.json` | `src/daily-cache.ts` | Tracks `lastComputedDate`; new days are backfilled, old days are reused. |

All three use atomic write (temp file + `rename`) and write with mode `0o600`. All three carry a numeric `version` field; bumping it forces a recompute next run.

### Optimize Detectors

`src/optimize.ts` exports 14 detectors. Each returns a `WasteFinding | null`. They are composed by `runOptimize()` which collects findings, ranks them by impact, and returns them with `WasteAction` objects (paste-to-CLAUDE.md, paste-to-session-opener, prompt-now, edit shell config).

| Detector | Line | What it catches |
|---|---|---|
| `detectJunkReads` | 428 | Reads into `node_modules`, `.git`, `dist`, etc. |
| `detectDuplicateReads` | 477 | Re-reads of the same file in a session. |
| `detectMcpToolCoverage` | 795 | MCP servers with many tools but low usage. |
| `detectUnusedMcp` | 855 | MCP servers configured but never invoked. |
| `detectBloatedClaudeMd` | 944 | `CLAUDE.md` files past a healthy size. |
| `detectLowReadEditRatio` | 987 | Edit-heavy sessions with too few prior reads. |
| `detectCacheBloat` | 1048 | High `cache_creation_input_tokens`. |
| `detectGhostAgents` | 1124 | Defined but never-invoked Claude agents. |
| `detectGhostSkills` | 1154 | Defined but never-invoked skills. |
| `detectGhostCommands` | 1184 | Defined but never-invoked slash commands. |
| `detectBashBloat` | 1228 | Shell output limit set above the recommended 15K chars. |
| `detectLowWorthSessions` | 1405 | Sessions with cost but no edits or git delivery. |
| `detectContextBloat` | 1512 | Input:output token ratio above 25:1. |
| `detectSessionOutliers` | 1558 | Sessions costing more than 2x the project average. |

### Output Formats

| Command | `--format` choices | Default |
|---|---|---|
| `report`, `today`, `month` | `tui`, `json` | `tui` |
| `status` | `terminal`, `menubar-json`, `json` | `terminal` |
| `export` | `csv`, `json` | `csv` |
| `plan` | `text`, `json` | `text` |

The macOS menubar and GNOME extension consume `menubar-json`. `src/menubar-json.ts` defines the contract; `tests/menubar-json.test.ts` pins it.

## Providers (`src/providers/`)

Every provider implements the `Provider` interface in `src/providers/types.ts`:

```ts
type Provider = {
  name: string
  displayName: string
  modelDisplayName(model: string): string
  toolDisplayName(rawTool: string): string
  discoverSessions(): Promise<SessionSource[]>
  createSessionParser(source: SessionSource, seenKeys: Set<string>): SessionParser
}
```

`src/providers/index.ts` registers twenty-one providers across two tiers:

- **Eager**: `claude`, `cline`, `codex`, `copilot`, `droid`, `gemini`, `ibm-bob`, `kilo-code`, `kiro`, `kimi`, `openclaw`, `pi`, `omp`, `qwen`, `roo-code`. Imported at module load.
- **Lazy**: `antigravity`, `goose`, `cursor`, `opencode`, `cursor-agent`, `crush`. Imported via dynamic `import()` so the heavy dependencies (SQLite, protobuf) do not touch users who do not have those tools installed.

Both lists hit the same `getAllProviders()` aggregator. A failed lazy import is silent and excludes that provider from the run.

`src/providers/vscode-cline-parser.ts` is a shared helper consumed by `cline`, `ibm-bob`, `kilo-code`, and `roo-code`. It is not registered as a provider on its own.

For the per-provider data location, storage format, parser quirks, and test coverage, see `docs/providers/`.

## macOS Menubar (`mac/`)

Swift package (`mac/Package.swift`), targets macOS 14, strict concurrency on. Layout under `mac/Sources/AiInsightMenubar/`:

- `AiInsightApp.swift` boots the SwiftUI `App` and the `NSStatusItem`.
- `AppStore.swift` is the single source of truth for UI state.
- `Data/` holds models, the CLI client, credential stores, and subscription services.
  - `DataClient.swift` spawns the CLI and decodes `MenubarPayload`. See file-level comment for why we never route through `/bin/zsh -c`.
  - `MenubarPayload.swift` mirrors the JSON the CLI emits; keep it in sync with `src/menubar-json.ts`.
- `Security/AiInsightCLI.swift` resolves the CLI binary (env override `AIINSIGHT_BIN`, fallback `aiinsight`), validates each argv entry against an allowlist regex, and augments PATH for Homebrew and npm-global installs. The Process is launched via `/usr/bin/env`, never via a shell.
- `Theme/` holds color and typography constants and the dark/light state.
- `Views/` are the SwiftUI components rendered inside `NSPopover`.

Tests live in `mac/Tests/AiInsightMenubarTests/` (currently `CapacityEstimatorTests.swift`).

The build artifact is a zipped `.app` bundle produced by `mac/Scripts/package-app.sh`. See `RELEASING.md` for how the GitHub Actions workflow uses it.

## GNOME Extension (`gnome/`)

Plain JavaScript, no bundler. Targets GNOME Shell 45-50 (`metadata.json`).

- `extension.js` is the entry point. On `enable()` it constructs a `AiInsightIndicator` and adds it to the panel.
- `indicator.js` is the popover. It owns the period selector, the insight tabs, and the provider filter.
- `dataClient.js` wraps `Gio.Subprocess` to call the CLI. It validates argv against the same allowlist pattern as the macOS client and augments PATH with `~/.local/bin`, `~/.npm-global/bin`, `~/.volta/bin`, `~/.bun/bin`, `~/.cargo/bin`, `~/.asdf/shims`, and a few others. Results are cached for 300 seconds.
- `prefs.js` is the settings dialog backed by `schemas/org.gnome.shell.extensions.aiinsight.gschema.xml`.
- `install.sh` copies the extension into `~/.local/share/gnome-shell/extensions/`.

## Build (`scripts/`, `tsup.config.ts`)

`npm run build` is two steps:

1. `node scripts/bundle-litellm.mjs` fetches the latest litellm pricing JSON and writes `src/data/litellm-snapshot.json`. The bundle script keeps a manual override for MiniMax variants. Direct (un-prefixed) entries win over prefixed ones. The result is checked in so the build is reproducible.
2. `tsup` reads `tsup.config.ts` and emits a single ESM bundle at `dist/cli.js` with a Node shebang banner. No source maps in publish builds; sourcemaps on for development.

The `prepublishOnly` hook in `package.json` runs `npm run build` so `npm publish` always ships fresh code.

## Tests

`npm test` runs vitest. Forty-two test files live under `tests/`:

- `tests/` root (27 files) covers CLI, parser, optimize, cache, format, models, plans.
- `tests/security/` (1 file) covers prototype-pollution guards.
- `tests/providers/` (15 files) covers per-provider parsing.
- `tests/fixtures/` holds redacted real-world session data.

Five providers ship without dedicated test files today: `antigravity`, `claude`, `gemini`, `goose`, `qwen`. Closing this gap is a standing good-first-issue.

CI runs Semgrep against `.semgrep/rules/no-bracket-assign-hot-paths.yml` over `src/providers/` and `src/parser.ts` (`.github/workflows/ci.yml`). It does not run vitest in CI today; tests run locally before publish.

---

## Cloud Packages

AiInsight Cloud extends the OSS CLI with team collaboration and analytics. Three new packages were added in Phase 1 and Phase 2.

### Sync Engine (`packages/sync-engine/`)

Client-side library that discovers, parses, and uploads provider session data to the cloud ingestion API.

```
packages/sync-engine/src/
├── index.ts                    # SyncEngine class, exports
├── api-client/
│   └── ingestion.client.ts     # HTTP client for API calls
├── providers/
│   ├── index.ts                # Adapter registry
│   ├── oss-types.ts            # Types copied from OSS parsers
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

### Ingestion API (`apps/ingestion-api/`)

Multi-tenant REST API that receives, validates, deduplicates, and stores usage events in PostgreSQL.

```
apps/ingestion-api/src/
├── index.ts                    # Express app setup
├── controllers/
│   └── ingestion.controller.ts # Request handlers
├── database/
│   ├── pool.ts                 # PostgreSQL connection pool
│   ├── migrate.ts              # Migration runner
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_sessions_events.sql
│       ├── 003_sync_tracking.sql
│       ├── 004_aggregation_runs.sql
│       ├── 005_daily_usage.sql
│       ├── 006_daily_provider_usage.sql
│       ├── 007_daily_model_usage.sql
│       ├── 008_daily_user_usage.sql
│       ├── 009_daily_project_usage.sql
│       └── 010_auth.sql
├── repositories/
│   ├── event.repository.ts
│   ├── machine.repository.ts
│   ├── organization.repository.ts
│   ├── provider.repository.ts
│   ├── session.repository.ts
│   ├── syncSource.repository.ts
│   ├── syncState.repository.ts
│   └── user.repository.ts
├── routes/
│   ├── health.route.ts
│   ├── ingestion.routes.ts
│   └── openapi.route.ts
└── validators/
    └── ingestion.validator.ts  # Zod schemas
```

### Analytics Engine (`packages/analytics-engine/`)

Core aggregation library that computes daily usage summaries from raw events.

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
├── logging/
│   └── analytics.logger.ts          # Pino logger with context
├── repositories/
│   └── analytics.repository.ts      # Database queries
├── services/
│   └── analytics.service.ts         # Service facade
└── types/
    └── analytics.types.ts           # TypeScript interfaces
```

### Dashboard API (`apps/dashboard-api/`)

Express REST API serving pre-aggregated analytics data with JWT and API key authentication.

```
apps/dashboard-api/src/
├── index.ts                         # Express app setup
├── controllers/
│   └── dashboard.controller.ts      # Request handlers
├── database/
│   └── pool.ts                      # PostgreSQL connection pool
├── logging/
│   └── dashboard.logger.ts          # Pino logger with context
├── middlewares/
│   └── auth.middleware.ts           # JWT + API key auth
├── repositories/
│   └── dashboard.repository.ts      # Read-only aggregate queries
├── routes/
│   ├── dashboard.routes.ts          # Dashboard endpoints
│   ├── auth.routes.ts               # Login/refresh endpoints
│   └── health.route.ts              # Health check
├── services/
│   └── dashboard.service.ts         # Business logic
└── validators/
    └── query.validator.ts           # Zod schemas
```

### Dashboard Web (`apps/dashboard-web/`)

Next.js 15 frontend for analytics visualization.

```
apps/dashboard-web/src/
├── app/
│   ├── layout.tsx                   # Root layout with providers
│   ├── page.tsx                     # Home (Overview)
│   ├── globals.css                  # Tailwind CSS
│   ├── login/page.tsx               # Login page
│   ├── providers/page.tsx           # Provider analytics
│   ├── models/page.tsx              # Model analytics
│   ├── users/page.tsx               # User analytics
│   ├── projects/page.tsx            # Project analytics
│   └── trends/page.tsx              # Usage trends
├── components/
│   ├── DashboardShell.tsx           # Layout with nav
│   ├── PeriodSelector.tsx           # Period dropdown
│   ├── pages/                       # Page components
│   ├── ui/                          # Card, Select primitives
│   └── charts/                      # Recharts components
│       ├── BarChart.tsx
│       ├── ProviderChart.tsx
│       └── TrendChart.tsx
├── hooks/
│   └── useDashboard.ts             # TanStack Query hooks
├── lib/
│   ├── api.ts                       # API client
│   ├── auth-context.tsx            # Auth React context
│   └── utils.ts                     # Utility functions
└── types/
    └── dashboard.ts                 # TypeScript interfaces
```

### Cloud Data Flow

```
Raw Events (Phase 1)
    │
    ▼
Analytics Engine Aggregators
    │
    ▼
Pre-aggregated Summary Tables
    │
    ▼
Dashboard API (reads from summary tables)
    │
    ▼
Dashboard Web (fetches via REST, renders charts/tables)
```

### Cloud Authentication

| Method | Use Case | Header |
|--------|----------|--------|
| JWT Token | Web dashboard users | `Authorization: Bearer <jwt>` |
| API Key | Machine-to-machine | `Authorization: Bearer cb_<key>` or `X-API-Key cb_<key>` |

### Cloud Roles

| Role | Permissions |
|------|-------------|
| `user` | View dashboard, query analytics |
| `org_admin` | All user permissions + trigger backfill, manage API keys |

### Containerization (Docker)

The cloud stack is fully containerized via `docker-compose.yml` at the project root. Each service has a multi-stage `Dockerfile` that builds from the monorepo root (to resolve workspace dependencies) and produces a minimal runtime image.

```
docker-compose.yml
├── postgres          (postgres:16-alpine, port 5432)
├── ingestion-api     (apps/ingestion-api/Dockerfile, port 3001)
├── dashboard-api     (apps/dashboard-api/Dockerfile, port 3002)
└── dashboard-web     (apps/dashboard-web/Dockerfile, port 3000)
```

**Build strategy:** Each Dockerfile has two stages — `base` (install + compile TypeScript) and `runtime` (copy only dist + production deps). The `analytics-engine` package is built inside the `dashboard-api` image since it is a workspace dependency.

**Database:** PostgreSQL 16 Alpine with a named volume (`postgres_data`). Health checks ensure APIs wait for the database to be ready before starting.

**Migrations:** Run manually after first deploy:
```bash
docker compose exec ingestion-api node dist/database/migrate.js
```

The local CLI, sync engine, macOS menubar, and GNOME extension are not containerized — they run on developer machines and sync to the hosted ingestion API.

For detailed cloud architecture, see `docs/phases/phase-01-cloud-foundation.md` and `docs/phases/phase-02-analytics-dashboard.md`.
