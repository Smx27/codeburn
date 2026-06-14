# Codebase Structure

**Analysis Date:** 2026-06-12

## Directory Layout

```
aiinsight/
├── src/                    # CLI core (Node.js/TypeScript)
├── tests/                  # Vitest test files
├── packages/
│   ├── analytics-engine/   # Cloud aggregation library
│   └── sync-engine/        # Client-side cloud sync
├── apps/
│   ├── ingestion-api/      # Cloud event ingestion REST API
│   ├── dashboard-api/      # Cloud analytics REST API
│   └── dashboard-web/      # Next.js analytics frontend
├── mac/                    # macOS menubar app (Swift)
├── gnome/                  # GNOME Shell extension (JavaScript)
├── scripts/                # Build scripts
├── docs/                   # Architecture docs, ADRs, provider docs
├── assets/                 # Static assets
├── dist/                   # Build output (gitignored)
├── graphify-out/           # Knowledge graph cache
├── .planning/              # GSD planning directory
├── .github/                # CI workflows, PR templates
├── .semgrep/               # Semgrep rules
├── .vscode/                # VS Code settings
├── package.json            # Root package (npm workspaces)
├── tsconfig.json           # Root TypeScript config
├── tsup.config.ts          # Bundle config (single ESM output)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── RELEASING.md
└── SECURITY.md
```

## Directory Purposes

**`src/`:**
- Purpose: CLI core — all parsing, aggregation, formatting, and optimization logic
- Contains: 40 TypeScript files, 1 JSX file (dashboard), data assets
- Key files: `cli.ts` (entry), `main.ts` (commands), `parser.ts` (core aggregator), `dashboard.tsx` (TUI), `models.ts` (pricing), `optimize.ts` (waste detectors)

**`src/providers/`:**
- Purpose: Plugin implementations for 21 AI coding tools
- Contains: 24 TypeScript files (21 providers + index + types + shared parser)
- Key files: `index.ts` (registry), `types.ts` (Provider contract), `claude.ts` (primary provider), `vscode-cline-parser.ts` (shared helper for 4 providers)

**`src/mcp/`:**
- Purpose: Model Context Protocol server exposing usage to AI agents
- Contains: 3 TypeScript files
- Key files: `server.ts` (MCP server), `tables.ts` (rendering), `redact.ts` (privacy)

**`src/data/`:**
- Purpose: Bundled pricing data for cost calculation
- Contains: 2 JSON files
- Key files: `litellm-snapshot.json` (auto-generated from LiteLLM), `pricing-fallback.json` (gap-fill data)

**`tests/`:**
- Purpose: Vitest test suite for CLI core
- Contains: 58 test files + fixtures directory
- Key files: `providers/` (15 provider-specific tests), `security/` (prototype pollution guards), `fixtures/` (redacted real-world session data)

**`packages/sync-engine/`:**
- Purpose: Client-side library for uploading session data to cloud
- Contains: `src/` with adapters, scheduler, uploader, state management
- Key files: `src/index.ts` (SyncEngine class), `src/providers/` (Claude/Codex/Cursor/Gemini adapters), `src/uploader/batchUploader.ts` (queue + retry)

**`packages/analytics-engine/`:**
- Purpose: Server-side aggregation library producing daily summary tables
- Contains: `src/` with aggregators, jobs, repositories, services
- Key files: `src/aggregators/` (5 aggregators: daily/provider/model/user/project), `src/jobs/` (dailyAggregation, historicalBackfill)

**`apps/ingestion-api/`:**
- Purpose: Multi-tenant REST API receiving usage events
- Contains: Express app with controllers, database, routes, validators
- Key files: `src/index.ts` (Express setup), `src/controllers/ingestion.controller.ts`, `src/database/migrations/` (10 SQL migrations)

**`apps/dashboard-api/`:**
- Purpose: REST API serving pre-aggregated analytics
- Contains: Express app with JWT/API key auth, controllers, repositories
- Key files: `src/index.ts` (Express setup), `src/middlewares/auth.middleware.ts`, `src/controllers/dashboard.controller.ts`

**`apps/dashboard-web/`:**
- Purpose: Next.js 15 frontend for analytics visualization
- Contains: App router pages, components, hooks, lib
- Key files: `src/app/page.tsx` (home), `src/components/` (charts, UI primitives), `src/hooks/useDashboard.ts` (TanStack Query), `src/lib/auth-context.tsx` (auth)

**`mac/`:**
- Purpose: macOS menubar app (Swift Package Manager, targets macOS 15)
- Contains: Swift sources, scripts, tests
- Key files: `Sources/CodeBurnMenubar/CodeBurnApp.swift` (entry), `Sources/CodeBurnMenubar/Data/DataClient.swift` (CLI consumer), `Package.swift`

**`gnome/`:**
- Purpose: GNOME Shell 45-50 panel extension
- Contains: Plain JavaScript, no bundler
- Key files: `extension.js` (entry), `indicator.js` (popover UI), `dataClient.js` (CLI consumer), `install.sh`

**`docs/`:**
- Purpose: Architecture documentation, ADRs, provider docs, roadmap
- Contains: Markdown files organized by topic
- Key files: `architecture.md` (system overview), `adr/` (architecture decision records), `providers/` (per-provider docs), `phases/` (implementation phases)

**`scripts/`:**
- Purpose: Build scripts
- Contains: 1 file
- Key files: `bundle-litellm.mjs` (fetches + bundles LiteLLM pricing)

## Key File Locations

**Entry Points:**
- `src/cli.ts`: CLI entry (shebang, version check, dynamic import)
- `src/main.ts`: Commander.js program with 12 commands
- `src/mcp/server.ts`: MCP stdio server entry
- `apps/ingestion-api/src/index.ts`: Express server (port 3001)
- `apps/dashboard-api/src/index.ts`: Express server (port 3002)
- `apps/dashboard-web/src/app/page.tsx`: Next.js home page
- `mac/Sources/CodeBurnMenubar/CodeBurnApp.swift`: macOS app entry
- `gnome/extension.js`: GNOME extension entry

**Configuration:**
- `package.json`: Root package manifest (npm workspaces, scripts, dependencies)
- `tsconfig.json`: Root TypeScript config (ES2022, ESNext modules, strict)
- `tsup.config.ts`: Bundle config (single ESM output to `dist/cli.js`)
- `~/.config/codeburn/config.json`: Runtime user config (plans, aliases, proxy paths)

**Core Logic:**
- `src/parser.ts`: Central session aggregator (1400+ lines)
- `src/models.ts`: Pricing engine with LiteLLM integration (689 lines)
- `src/optimize.ts`: 14 waste detectors
- `src/classifier.ts`: Task category classification
- `src/usage-aggregator.ts`: Period data and menubar payload builder
- `src/daily-cache.ts`: Persistent daily aggregates
- `src/config.ts`: Config read/write with atomic operations
- `src/menubar-json.ts`: MenubarPayload contract definition

**Testing:**
- `tests/`: 58 test files covering CLI, parser, optimize, cache, format, models
- `tests/providers/`: 15 provider-specific test files
- `tests/fixtures/`: Redacted real-world session data
- `tests/security/`: Prototype pollution guards
- `vitest.config.ts`: Vitest configuration (not present in root; uses `package.json` scripts)

## Naming Conventions

**Files:**
- kebab-case for all TypeScript files: `usage-aggregator.ts`, `daily-cache.ts`, `session-cache.ts`
- Provider files match tool names: `claude.ts`, `cursor.ts`, `codex.ts`
- Test files append `.test.ts`: `parser.test.ts`, `cli-date.test.ts`
- Type definition files: `types.ts` (both root `src/types.ts` and per-directory)

**Directories:**
- kebab-case: `analytics-engine/`, `sync-engine/`, `ingestion-api/`
- Source directories: `src/`, `controllers/`, `repositories/`, `services/`, `routes/`

**Types:**
- PascalCase for types/interfaces: `Provider`, `SessionSummary`, `MenubarPayload`
- Suffix with purpose: `SessionSummary`, `ProjectSummary`, `PeriodData`
- Enums/constants: UPPER_SNAKE_CASE: `CATEGORY_LABELS`, `BASH_TOOLS`, `EDIT_TOOLS`

**Functions:**
- camelCase: `parseAllSessions`, `buildMenubarPayload`, `loadPricing`
- Prefix with action: `parse`, `build`, `load`, `render`, `detect`, `aggregate`
- Boolean returns: `isX` or `hasX`: `isProxiedPath`, `hasEdits`

## Where to Add New Code

**New AI Provider:**
- Create `src/providers/<provider-name>.ts` implementing `Provider` interface
- Register in `src/providers/index.ts` (add to `coreProviders` or lazy-load)
- Add test in `tests/providers/<provider-name>.test.ts`
- Add documentation in `docs/providers/<provider-name>.md`

**New CLI Command:**
- Add command in `src/main.ts` using Commander.js `.command()` pattern
- Add handler function following existing patterns (load pricing → parse sessions → format output)
- Add `--format` option if multiple output formats needed
- Test in `tests/` with CLI integration tests

**New Optimize Detector:**
- Add detector function in `src/optimize.ts` returning `WasteFinding | null`
- Add to `DETECTORS` array in `src/optimize.ts`
- Add test in `tests/optimize.test.ts`

**New MCP Tool:**
- Register tool in `src/mcp/server.ts` using `server.registerTool()`
- Add rendering helper in `src/mcp/tables.ts`
- Add test in `tests/mcp-server.test.ts`

**New Cloud Aggregator:**
- Add aggregator in `packages/analytics-engine/src/aggregators/`
- Add repository queries in `packages/analytics-engine/src/repositories/`
- Add migration if new table needed in `apps/ingestion-api/src/database/migrations/`
- Wire into aggregation job in `packages/analytics-engine/src/jobs/dailyAggregation.job.ts`

**New Dashboard Page:**
- Add page in `apps/dashboard-web/src/app/<page>/page.tsx`
- Add components in `apps/dashboard-web/src/components/pages/`
- Add API endpoint in `apps/dashboard-api/src/routes/`
- Add query hook in `apps/dashboard-web/src/hooks/`

**New Cloud API Endpoint:**
- Add route in `apps/dashboard-api/src/routes/`
- Add controller method in `apps/dashboard-api/src/controllers/`
- Add service method in `apps/dashboard-api/src/services/`
- Add Zod validation in `apps/dashboard-api/src/validators/`
- Add test in `apps/dashboard-api/src/` test files

## Special Directories

**`dist/`:**
- Purpose: TypeScript build output (single ESM bundle)
- Generated: Yes (`npm run build`)
- Committed: No (`.gitignore`)

**`.cache/codeburn/`:**
- Purpose: Runtime cache (daily-cache.json, codex-results.json, cursor-results.json)
- Generated: Yes (runtime)
- Committed: No (user-local)

**`.config/codeburn/`:**
- Purpose: User configuration (config.json, machine-id)
- Generated: Yes (runtime)
- Committed: No (user-local)

**`graphify-out/`:**
- Purpose: Knowledge graph cache (AST and semantic analysis)
- Generated: Yes (graphify tool)
- Committed: No

**`tests/fixtures/`:**
- Purpose: Redacted real-world session data for tests
- Generated: No
- Committed: Yes

**`src/data/`:**
- Purpose: Bundled pricing data (auto-generated + manual overrides)
- Generated: Partially (`scripts/bundle-litellm.mjs` generates `litellm-snapshot.json`)
- Committed: Yes

---

*Structure analysis: 2026-06-12*
