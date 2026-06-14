# External Integrations

**Analysis Date:** 2026-06-12

## APIs & External Services

**Pricing Data:**
- LiteLLM Model Pricing - Live model pricing data for cost calculation
  - URL: `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json`
  - Client: Native `fetch()` with 8s timeout (`src/fetch-utils.ts`)
  - Fallback: Bundled snapshot at `src/data/litellm-snapshot.json` + `src/data/pricing-fallback.json`
  - Cache: 24-hour TTL in-memory cache (`src/models.ts`)

**AI Coding Providers (Session Sources):**
- Claude Code (`src/providers/claude.ts`)
- Cursor (`src/providers/cursor.ts`, `src/providers/cursor-agent.ts`)
- GitHub Copilot (`src/providers/copilot.ts`)
- OpenAI Codex (`src/providers/codex.ts`)
- Google Gemini (`src/providers/gemini.ts`)
- Devin (`src/providers/devin.ts`)
- Kimi (`src/providers/kimi.ts`)
- IBM Bob (`src/providers/ibm-bob.ts`)
- Cline/Roo Code (`src/providers/cline.ts`, `src/providers/roo-code.ts`)
- Codebuff (`src/providers/codebuff.ts`)
- OpenCode (`src/providers/opencode.ts`)
- Kiro (`src/providers/kiro.ts`)
- Qwen (`src/providers/qwen.ts`)
- Pi/OMP (`src/providers/pi.ts`)
- Goose (`src/providers/goose.ts`)
- Warp (`src/providers/warp.ts`)
- Crush (`src/providers/crush.ts`)
- Mistral Vibe (`src/providers/mistral-vibe.ts`)
- Droid (`src/providers/droid.ts`)
- Kilo Code (`src/providers/kilo-code.ts`)
- OpenClaw (`src/providers/openclaw.ts`)
- Vercel Gateway (`src/providers/vercel-gateway.ts`)
- Forge (`src/providers/forge.ts`)
- Mux (`src/providers/mux.ts`)
- Antigravity (`src/providers/antigravity.ts`)

**Ingestion API (Internal):**
- CodeBurn Ingestion API - Cloud event ingestion service
  - Endpoint: `http://localhost:3001/api/v1/ingest/batch`
  - Client: `packages/sync-engine/src/api-client/ingestion.client.ts`
  - Auth: Bearer token (API key)

## Data Storage

**Databases:**
- PostgreSQL (Cloud features)
  - Connection: `DATABASE_URL` env var
  - Client: `pg` package with connection pooling (`apps/ingestion-api/src/database/pool.ts`)
  - Migrations: `apps/ingestion-api/src/database/migrations/` (10 migration files)
  - Schema: Multi-tenant with organizations, users, machines, sessions, events, aggregations

- SQLite (Local CLI)
  - Connection: Read-only access to Cursor/OpenCode session databases
  - Client: Node.js built-in `node:sqlite` module (`src/sqlite.ts`)
  - Path: Provider-specific session storage locations
  - Access: Read-only with busy timeout handling

**File Storage:**
- Local filesystem only
  - Config: `~/.config/codeburn/config.json`
  - Exports: CSV/JSON files to user-specified paths
  - Cache: Session parsing cache in memory

**Caching:**
- In-memory pricing cache (24h TTL)
- Session parsing cache (cleared between periods)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `apps/dashboard-api/src/middlewares/auth.middleware.ts`
  - Token signing: `jsonwebtoken` package
  - Secret: `JWT_SECRET` env var
  - Expiry: 24 hours
  - Payload: `{ sub, email, name, orgId, role }`

**API Key Authentication:**
- Machine-to-machine authentication
  - Format: `cb_` prefix + 8-char prefix for lookup
  - Storage: `api_keys` table with bcrypt-hashed keys
  - Validation: Prefix lookup + bcrypt compare
  - Roles: `read`, `write`, `admin`

**Password Authentication:**
- User login via email/password
  - Hashing: bcrypt
  - Storage: `users.password_hash` column
  - Login endpoint: `POST /api/v1/auth/login`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, etc.)

**Logs:**
- Structured JSON logging via Pino
  - CLI: stderr via `pino-pretty`
  - APIs: `pino-http` middleware for request logging
  - Config: `LOG_LEVEL` env var (default: `info`)
  - Files: `apps/dashboard-api/src/logging/dashboard.logger.ts`

## CI/CD & Deployment

**Hosting:**
- CLI: npm registry (`codeburn` package)
- APIs: Self-hosted or containerized
- Web: Vercel or self-hosted Next.js

**CI Pipeline:**
- GitHub Actions
  - Workflow: `.github/workflows/ci.yml`
  - Trigger: Push to main, PRs
  - Steps: Semgrep security scanning on provider code
  - Semgrep rules: `.semgrep/rules/no-bracket-assign-hot-paths.yml`

- Additional workflows:
  - `.github/workflows/release-menubar.yml` - macOS menubar app release
  - `.github/workflows/firstlook.yml` - First-look feature
  - `.github/workflows/block-claude-coauthor.yml` - Git commit author validation

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection (ingestion-api, dashboard-api)
- `JWT_SECRET` - Authentication secret (dashboard-api)
- `PORT` - Server port (default: 3001 ingestion, 3002 dashboard-api)
- `NEXT_PUBLIC_API_URL` - Dashboard API URL (dashboard-web)
- `CODEBURN_TZ` - Timezone override (CLI)

**Secrets location:**
- `.env` files per app (not committed)
- `~/.config/codeburn/config.json` for user preferences

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (CLI reads local files, syncs to internal API only)

## MCP (Model Context Protocol) Integration

**Server:**
- Location: `src/mcp/server.ts`
- Transport: Stdio (JSON-RPC)
- Tools exposed:
  - `get_usage` - AI coding token spend and usage
  - `get_savings` - Cost reduction opportunities
- Purpose: Expose CodeBurn data to AI coding agents

## Sync Engine Integration

**Purpose:** Historical and incremental synchronization to CodeBurn Cloud

**Components:**
- `packages/sync-engine/src/index.ts` - Main sync engine
- `packages/sync-engine/src/scheduler/syncLoop.ts` - Scheduled sync loop
- `packages/sync-engine/src/services/historicalSync.service.ts` - Full historical sync
- `packages/sync-engine/src/services/incrementalSync.service.ts` - Incremental sync
- `packages/sync-engine/src/uploader/batchUploader.ts` - Batch upload to API

**Config:**
- `organizationId` - Organization identifier
- `machineId` - Machine identifier (auto-generated)
- `apiUrl` - Ingestion API endpoint
- `apiKey` - Authentication key

## Analytics Engine Integration

**Purpose:** Aggregation and analytics processing for cloud dashboard

**Components:**
- `packages/analytics-engine/src/index.ts` - Main export
- `packages/analytics-engine/src/jobs/dailyAggregation.job.ts` - Daily rollup
- `packages/analytics-engine/src/jobs/historicalBackfill.job.ts` - Historical backfill
- `packages/analytics-engine/src/aggregators/` - Various aggregation functions

**Aggregation Types:**
- Daily usage rollup
- Provider usage
- Model usage
- User usage
- Project usage

---

*Integration audit: 2026-06-12*
