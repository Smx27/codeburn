# Technology Stack

**Analysis Date:** 2026-06-12

## Languages

**Primary:**
- TypeScript 5.8+ - All application code (CLI, APIs, web dashboard, packages)

**Secondary:**
- SQL - PostgreSQL migrations (`apps/ingestion-api/src/database/migrations/`)
- JavaScript (ESM) - Build scripts, module interop

## Runtime

**Environment:**
- Node.js >=22.13.0 (required by CLI `engines` field)
- Uses `node:sqlite` built-in module (stable in Node 24, experimental in Node 22/23)
- ESM modules throughout (`"type": "module"` in all package.json)

**Package Manager:**
- npm (workspaces)
- Lockfile: `package-lock.json` present at root

## Frameworks

**Core:**
- Commander.js 13.x - CLI command parsing (`src/main.ts`, `src/cli.ts`)
- Ink 7.x + React 19.x - Terminal UI rendering (`src/format.ts`, `src/dashboard.ts`)
- Express 4.x - REST APIs (`apps/ingestion-api/`, `apps/dashboard-api/`)
- Next.js 15.x - Web dashboard (`apps/dashboard-web/`)
- Model Context Protocol SDK 1.29.x - MCP server for AI agent integration (`src/mcp/`)

**Testing:**
- Vitest 3.1.x - Unit and integration testing

**Build/Dev:**
- tsup 8.4.x - CLI bundling (`tsup.config.ts`)
- tsx 4.19.x - TypeScript execution for dev mode
- TypeScript 5.8.x - Type checking and compilation

## Key Dependencies

**Critical:**
- `@modelcontextprotocol/sdk` ^1.29.0 - MCP server for exposing usage data to AI agents
- `commander` ^13.1.0 - CLI framework
- `ink` ^7.0.0 + `react` ^19.2.5 - Terminal UI rendering
- `zod` ^3.25.76 - Schema validation (used across all packages)
- `pg` ^8.13.1 - PostgreSQL client for cloud services
- `express` ^4.21.2 - HTTP API framework
- `next` ^15.0.0 - React framework for web dashboard
- `jsonwebtoken` ^9.0.2 - JWT authentication
- `bcrypt` ^5.1.1 - Password/API key hashing

**Infrastructure:**
- `pino` ^9.3.2 + `pino-http` - Structured logging (APIs)
- `dotenv` ^17.4.2 - Environment variable loading
- `cors` ^2.8.5 - Cross-origin request support
- `@asteasolutions/zod-to-openapi` ^7.2.1 - OpenAPI spec generation
- `swagger-ui-express` ^5.0.1 - API documentation UI

**Frontend:**
- `@tanstack/react-query` ^5.60.0 - Server state management
- `recharts` ^2.13.0 - Chart visualization
- `react-hook-form` ^7.53.0 - Form handling
- `tailwindcss` ^3.4.0 - Utility-first CSS
- `lucide-react` ^0.460.0 - Icons
- `class-variance-authority` ^0.7.1 + `clsx` + `tailwind-merge` - CSS utility helpers

**Data Processing:**
- `node:sqlite` - Local SQLite read-only access for Cursor/OpenCode session DBs
- `chalk` ^5.4.1 - Terminal color output
- `strip-ansi` ^7.2.0 - ANSI escape code removal

## Configuration

**Environment:**
- `.env` files in each app directory (ingestion-api, dashboard-api, dashboard-web)
- `.env.example` templates provided for each app
- Key config variables:
  - `DATABASE_URL` - PostgreSQL connection string (ingestion-api, dashboard-api)
  - `JWT_SECRET` - Authentication secret (dashboard-api)
  - `PORT` - Server port (3001 ingestion, 3002 dashboard-api)
  - `NEXT_PUBLIC_API_URL` - Dashboard API URL (dashboard-web)
  - `LOG_LEVEL` - Logging verbosity

**Build:**
- `tsconfig.json` - Root TypeScript config (ES2022 target, ESNext modules, strict mode)
- `tsup.config.ts` - CLI bundle config (ESM output, node20 target)
- Per-workspace `tsconfig.json` files for apps and packages

**Application Config:**
- `~/.config/codeburn/config.json` - User-level configuration (currency, model aliases, sync settings, proxy paths)
- In-memory pricing cache loaded from bundled snapshot + live LiteLLM fetch

## Platform Requirements

**Development:**
- Node.js >=22.13.0
- PostgreSQL (for cloud features)
- npm workspaces

**Production:**
- CLI: Distributed via npm as `codeburn` package
- APIs: Containerized or bare-metal Node.js servers
- Web: Vercel or self-hosted Next.js

---

*Stack analysis: 2026-06-12*
