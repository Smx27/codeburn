<!-- refreshed: 2026-06-12 -->
# Architecture

**Analysis Date:** 2026-06-12

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Client Surfaces                                    │
├───────────────────┬─────────────────────┬───────────────────────────────────┤
│  macOS Menubar    │  GNOME Extension    │  Cloud Dashboard (Next.js)        │
│  (Swift/SwiftUI)  │  (Plain JavaScript) │  `apps/dashboard-web/`            │
│  `mac/`           │  `gnome/`            │                                   │
└────────┬──────────┴──────────┬──────────┴──────────────┬────────────────────┘
         │  shell out          │  shell out               │  REST API
         │  `codeburn status`  │  `codeburn status`       │  Dashboard API
         ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLI Core (`src/`)                                   │
│  Commander.js entry → Parser pipeline → Formatter/Aggregator                │
│  `src/cli.ts` → `src/main.ts` → `src/parser.ts` → `src/format.ts`          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Provider Layer (`src/providers/`)                         │
│  21 providers: Claude, Cursor, Codex, Copilot, Gemini, Devin, ...           │
│  `src/providers/index.ts` (registry) + `src/providers/types.ts` (contract) │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Local Data (on-disk)                                      │
│  Session JSONL files, SQLite DBs, protobuf, config at ~/.config/codeburn/  │
│  Cache at ~/.cache/codeburn/ (daily-cache.json, codex-results.json, etc.)  │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼  (codeburn sync command)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Cloud Sync (`packages/sync-engine/`)                      │
│  Historical + incremental upload → Ingestion API                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Ingestion API (`apps/ingestion-api/`)                     │
│  Express REST API → PostgreSQL (raw events, sessions, machines)             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Analytics Engine (`packages/analytics-engine/`)            │
│  Daily aggregation jobs → Pre-aggregated summary tables in PostgreSQL       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Dashboard API (`apps/dashboard-api/`)                      │
│  Express REST API + JWT auth → Reads summary tables → JSON responses        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Dashboard Web (`apps/dashboard-web/`)                      │
│  Next.js 15 + TanStack Query + Recharts → Charts/Tables for users          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| CLI Entry | Commander.js command registration, arg parsing, preAction hooks | `src/cli.ts`, `src/main.ts` |
| Session Parser | Discover sessions from all providers, aggregate into ProjectSummary[] | `src/parser.ts` |
| Provider Registry | Register 21 providers, lazy-load optional ones, discover + parse sessions | `src/providers/index.ts` |
| Provider Interface | Contract: `discoverSessions()` + `createSessionParser()` | `src/providers/types.ts` |
| Pricing Engine | Load snapshot + live LiteLLM pricing, cost calculation per token | `src/models.ts` |
| Dashboard TUI | Ink-based interactive terminal dashboard with charts | `src/dashboard.tsx` |
| Menubar JSON | Canonical output contract consumed by macOS and GNOME clients | `src/menubar-json.ts` |
| Usage Aggregator | Build PeriodData, menubar payloads, daily cache hydration | `src/usage-aggregator.ts` |
| Daily Cache | Persistent per-day aggregates, backfill, incremental update | `src/daily-cache.ts` |
| Config Manager | Read/write `~/.config/codeburn/config.json` (plans, aliases, proxy paths) | `src/config.ts` |
| Optimize Engine | 14 waste detectors for token savings analysis | `src/optimize.ts` |
| Classifier | Classify turns into task categories (coding, debugging, etc.) | `src/classifier.ts` |
| MCP Server | Model Context Protocol stdio server exposing usage to AI agents | `src/mcp/server.ts` |
| Sync Engine | Client-side upload to cloud: discover, parse, batch upload | `packages/sync-engine/src/` |
| Ingestion API | Multi-tenant REST API: receive, validate, store events in PostgreSQL | `apps/ingestion-api/src/` |
| Analytics Engine | Daily aggregation jobs producing summary tables | `packages/analytics-engine/src/` |
| Dashboard API | Serve pre-aggregated analytics with JWT/API key auth | `apps/dashboard-api/src/` |
| Dashboard Web | Next.js frontend for analytics visualization | `apps/dashboard-web/src/` |
| macOS Menubar | SwiftUI macOS status bar app consuming `menubar-json` | `mac/Sources/` |
| GNOME Extension | GNOME Shell panel extension consuming `menubar-json` | `gnome/` |

## Pattern Overview

**Overall:** Monorepo with CLI-first architecture + cloud extension packages.

**Key Characteristics:**
- CLI is the single source of truth for data parsing and aggregation
- GUI clients (macOS, GNOME) shell out to the CLI; they do not share parsing code
- Provider plugin architecture: each AI tool implements a standard `Provider` interface
- Lazy-loading for heavy provider dependencies (SQLite, protobuf)
- Cloud packages extend the OSS CLI via sync + API + aggregation pipeline
- Monorepo managed via npm workspaces (`packages/*`, `apps/*`)

## Layers

**CLI Core (`src/`):**
- Purpose: Parse AI coding session data from 21 providers, aggregate, and output
- Location: `src/`
- Contains: Entry point, parser, classifier, pricing, formatter, optimize engine, cache, config
- Depends on: `src/providers/` (session data), `src/models.ts` (pricing), `src/config.ts` (user config)
- Used by: macOS menubar, GNOME extension, MCP server, cloud sync engine

**Provider Layer (`src/providers/`):**
- Purpose: Discover and parse session files for each AI coding tool
- Location: `src/providers/`
- Contains: 21 provider implementations, each implementing `Provider` interface
- Depends on: File system (reading JSONL, SQLite, protobuf files)
- Used by: `src/parser.ts` (discovers + delegates parsing)

**Aggregation Layer:**
- Purpose: Roll up parsed turns into session summaries, daily aggregates, period reports
- Location: `src/parser.ts`, `src/usage-aggregator.ts`, `src/day-aggregator.ts`, `src/daily-cache.ts`
- Contains: Session summary building, daily cache management, period data construction
- Depends on: Provider layer output (`ParsedProviderCall[]`)
- Used by: Dashboard TUI, menubar JSON, optimize engine

**Output Layer:**
- Purpose: Format aggregated data for different consumers
- Location: `src/dashboard.tsx`, `src/format.ts`, `src/menubar-json.ts`, `src/export.ts`
- Contains: TUI rendering (Ink), JSON export, CSV export, status bar formatting
- Depends on: Aggregation layer
- Used by: CLI commands, macOS/GNOME clients

**Cloud Packages (`packages/`):**
- Purpose: Client-side sync and server-side analytics for cloud dashboard
- Location: `packages/sync-engine/`, `packages/analytics-engine/`
- Contains: Upload logic, aggregation jobs, database queries
- Depends on: Local session data (sync), PostgreSQL (analytics)
- Used by: Ingestion API, Dashboard API

**Cloud Apps (`apps/`):**
- Purpose: REST APIs and web frontend for cloud analytics
- Location: `apps/ingestion-api/`, `apps/dashboard-api/`, `apps/dashboard-web/`
- Contains: Express servers, Next.js app, database pools, auth middleware
- Depends on: PostgreSQL, cloud packages
- Used by: End users (dashboard), sync engine (ingestion)

## Data Flow

### Primary CLI Request Path

1. CLI command invoked (`src/cli.ts:12` → `src/main.ts`)
2. Config loaded (`src/config.ts:74` `readConfig()`)
3. Pricing loaded (`src/models.ts` `loadPricing()`)
4. Sessions discovered from all providers (`src/providers/index.ts:176` `discoverAllSessions()`)
5. Sessions parsed into `ParsedProviderCall[]` (`src/parser.ts:1270` `parseAllSessions()`)
6. Aggregated into `ProjectSummary[]` (`src/parser.ts:1263` `buildSessionSummary()`)
7. Formatted for output (TUI via `src/dashboard.tsx`, JSON via `src/main.ts`, menubar via `src/menubar-json.ts`)

### Cloud Sync Path

1. User runs `codeburn sync` (`src/main.ts:1175`)
2. Sync engine discovers local sessions (`packages/sync-engine/src/providers/`)
3. Sessions parsed using OSS provider adapters
4. Batch uploaded to Ingestion API (`packages/sync-engine/src/uploader/batchUploader.ts`)
5. Ingestion API validates + stores in PostgreSQL (`apps/ingestion-api/src/controllers/`)
6. Analytics Engine runs daily aggregation jobs (`packages/analytics-engine/src/jobs/`)
7. Dashboard API serves pre-aggregated data (`apps/dashboard-api/src/controllers/`)
8. Dashboard Web renders charts (`apps/dashboard-web/src/components/`)

### MCP Server Path

1. `codeburn mcp` invoked (`src/main.ts:1163`)
2. MCP stdio server started (`src/mcp/server.ts:132` `startStdioServer()`)
3. AI agent calls `get_usage` or `get_savings` tool
4. Server aggregates data via `buildMenubarPayloadForRange()` (`src/usage-aggregator.ts`)
5. Results returned as structured JSON to the AI agent

**State Management:**
- CLI is stateless per invocation (reads from disk each time)
- Daily cache (`~/.cache/codeburn/daily-cache.json`) provides incremental updates
- Session dedup via `seenKeys` Set passed through all provider parsers
- Config state in `~/.config/codeburn/config.json`
- Cloud state in PostgreSQL + local sync state file

## Key Abstractions

**Provider Interface:**
- Purpose: Uniform contract for discovering and parsing AI tool session data
- Examples: `src/providers/claude.ts`, `src/providers/cursor.ts`, `src/providers/codex.ts`
- Pattern: Strategy pattern — each provider implements `discoverSessions()` + `createSessionParser()`

**ParsedProviderCall:**
- Purpose: Normalized representation of a single API call from any provider
- Examples: `src/providers/types.ts`
- Pattern: Canonical data model that all providers emit and all consumers consume

**ProjectSummary / SessionSummary:**
- Purpose: Aggregated view of usage across sessions and projects
- Examples: `src/types.ts:126`, `src/types.ts:158`
- Pattern: Aggregate root pattern — `ProjectSummary` contains `SessionSummary[]` which contain `ClassifiedTurn[]`

**MenubarPayload:**
- Purpose: Canonical JSON contract consumed by macOS and GNOME clients
- Examples: `src/menubar-json.ts:77`
- Pattern: API contract pattern — stable interface between CLI and GUI clients

**PeriodData:**
- Purpose: Time-windowed rollup of usage data for a specific period
- Examples: `src/menubar-json.ts:4`
- Pattern: Time-series aggregation — used for today/week/month/all windows

## Entry Points

**CLI (`src/cli.ts`):**
- Location: `src/cli.ts`
- Triggers: `codeburn` command (npm bin entry)
- Responsibilities: Version check, dynamic import of `src/main.ts`

**CLI Main (`src/main.ts`):**
- Location: `src/main.ts`
- Triggers: All 12 CLI commands
- Responsibilities: Commander.js program setup, command handlers, preAction hooks

**MCP Server (`src/mcp/server.ts`):**
- Location: `src/mcp/server.ts`
- Triggers: `codeburn mcp` command
- Responsibilities: Expose usage + savings tools via Model Context Protocol

**Ingestion API (`apps/ingestion-api/src/index.ts`):**
- Location: `apps/ingestion-api/src/index.ts`
- Triggers: HTTP requests to `POST /api/v1/ingest`
- Responsibilities: Receive, validate, deduplicate, store usage events

**Dashboard API (`apps/dashboard-api/src/index.ts`):**
- Location: `apps/dashboard-api/src/index.ts`
- Triggers: HTTP requests to `/api/v1/dashboard/*`
- Responsibilities: Serve pre-aggregated analytics with auth

**Dashboard Web (`apps/dashboard-web/src/app/`):**
- Location: `apps/dashboard-web/src/app/page.tsx`
- Triggers: Browser navigation
- Responsibilities: Render analytics dashboard via Next.js

**macOS Menubar (`mac/Sources/`):**
- Location: `mac/Sources/CodeBurnMenubar/CodeBurnApp.swift`
- Triggers: macOS system launch
- Responsibilities: Status bar app consuming `menubar-json` via CLI

**GNOME Extension (`gnome/extension.js`):**
- Location: `gnome/extension.js`
- Triggers: GNOME Shell `enable()`
- Responsibilities: Panel indicator consuming `menubar-json` via CLI

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop for CLI and APIs. macOS menubar uses Swift strict concurrency. GNOME extension is synchronous Gio.Subprocess calls.
- **Global state:** `pricingCache` and `sortedPricingKeys` in `src/models.ts` are module-level singletons. `configCache` in `src/config.ts` is read once per CLI invocation via `preAction` hook.
- **Circular imports:** None detected. Provider imports are strictly leaf-to-registry.
- **Data volume:** JSONL session files can be large (32KB+ per line). Parser uses custom streaming JSON scanner (`src/parser.ts` `parseLargeJsonlLine()`) to avoid full deserialization.
- **Platform coupling:** macOS and GNOME clients shell out to the CLI binary; they cannot parse sessions directly. The `menubar-json` format is the stable contract.

## Anti-Patterns

### Re-implementing parsing in clients

**What happens:** macOS/GNOME clients must consume `menubar-json` output, not raw session files.
**Why it's wrong:** Parsing logic lives in `src/parser.ts` and evolves independently. Clients that parse raw data would break on format changes.
**Do this instead:** Shell out to `codeburn status --format menubar-json` and parse the JSON output. See `mac/Sources/CodeBurnMenubar/Data/DataClient.swift` and `gnome/dataClient.js`.

### Eager-loading heavy provider dependencies

**What happens:** Some providers require SQLite, protobuf, or other heavy dependencies.
**Why it's wrong:** Users who don't use those providers shouldn't pay the startup cost.
**Do this instead:** Use lazy `import()` in `src/providers/index.ts` (e.g., `loadCursor()`, `loadForge()`). Failed imports are silent.

### Hardcoding model pricing

**What happens:** Model pricing changes frequently as providers update rates.
**Why it's wrong:** Hardcoded prices go stale immediately, showing incorrect cost data.
**Do this instead:** Use `src/models.ts` with LiteLLM snapshot (`src/data/litellm-snapshot.json`) + live fetch fallback + user-configurable aliases.

## Error Handling

**Strategy:** Fail gracefully at the session/file level; never abort the entire run for one bad file.

**Patterns:**
- Per-file parse errors caught in `parseProviderSources()` — logged to stderr, session excluded
- Large JSONL lines (>32KB) handled by custom streaming parser instead of `JSON.parse()`
- Cache writes use atomic temp file + `rename` to prevent corruption
- CLI commands exit with `process.exit(1)` for user errors, stderr for system errors
- MCP server returns `isError: true` responses instead of crashing

## Cross-Cutting Concerns

**Logging:** Pino logger for cloud APIs (`apps/ingestion-api/`, `apps/dashboard-api/`, `packages/`). CLI uses `console.error` / `process.stderr.write` for warnings. Verbose mode via `--verbose` flag.

**Validation:** Zod schemas for API request validation (`apps/ingestion-api/src/validators/`, `apps/dashboard-api/src/validators/`). TypeScript strict mode for compile-time safety.

**Authentication:** JWT + API key auth for cloud APIs (`apps/dashboard-api/src/middlewares/auth.middleware.ts`). No auth for CLI (local tool).

**Configuration:** `~/.config/codeburn/config.json` with atomic writes (randomized temp path + rename). Config read once per CLI invocation via `preAction` hook.

---

*Architecture analysis: 2026-06-12*
