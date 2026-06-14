# AiInsight Developer Setup Guide

This guide walks you through setting up AiInsight for local development, including the cloud services, database, and test data.

## Prerequisites

- **Node.js** 22+ (required for `node:sqlite`)
- **PostgreSQL** 14+ (or use Docker)
- **npm** 10+ (workspaces support)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/priya/aiinsight
cd aiinsight

# 2. Install dependencies
npm install

# 3. Start PostgreSQL (using Docker)
docker run -d --name aiinsight-postgres \
  -e POSTGRES_DB=aiinsight \
  -e POSTGRES_USER=aiinsight \
  -e POSTGRES_PASSWORD=aiinsight_secret \
  -p 5432:5432 \
  postgres:16-alpine

# 4. Set up environment
export DATABASE_URL=postgresql://aiinsight:aiinsight_secret@localhost:5432/aiinsight
export JWT_SECRET=your-dev-secret-here

# 5. Run migrations
npm run api:migrate

# 6. Seed test data
npm run dev:setup-org

# 7. Start the services
npm run api:dev          # Ingestion API (port 3001)
npm run dashboard-api:dev # Dashboard API (port 3002)
npm run dashboard-web:dev # Dashboard Web (port 3000)
```

## Project Structure

```
aiinsight/
├── apps/
│   ├── ingestion-api/     # REST API for data ingestion (port 3001)
│   ├── dashboard-api/     # REST API for analytics + auth (port 3002)
│   └── dashboard-web/     # Next.js 15 web dashboard (port 3000)
├── packages/
│   ├── sync-engine/       # Client-side sync library
│   └── analytics-engine/  # Aggregation library
├── src/                   # CLI tool (OSS)
├── scripts/
│   ├── seeds/             # Seed data scripts
│   └── dev/               # Development setup scripts
├── docs/                  # Documentation
└── docker-compose.yml     # Docker setup
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://aiinsight:aiinsight_secret@localhost:5432/aiinsight` |
| `JWT_SECRET` | Secret for JWT signing | `aiinsight-dev-secret-change-in-production` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` (ingestion), `3002` (dashboard) |
| `LOG_LEVEL` | Pino log level | `info` |
| `REQUIRE_INGEST_AUTH` | Require auth on ingestion API | `true` |

## Database

### Running Migrations

```bash
# Run all pending migrations
npm run api:migrate

# Or directly with the migration script
npx tsx apps/ingestion-api/src/database/migrate.ts
```

### Migration Files

Migrations are in `apps/ingestion-api/src/database/migrations/`:

| Migration | Tables |
|-----------|--------|
| `001_initial_schema.sql` | organizations, users, machines, providers |
| `002_sessions_events.sql` | sessions, events |
| `003_sync_tracking.sql` | sync_sources, sync_state |
| `004_aggregation_runs.sql` | aggregation_runs |
| `005_daily_usage.sql` | daily_usage |
| `006_daily_provider_usage.sql` | daily_provider_usage |
| `007_daily_model_usage.sql` | daily_model_usage |
| `008_daily_user_usage.sql` | daily_user_usage |
| `009_daily_project_usage.sql` | daily_project_usage |
| `010_auth.sql` | api_keys, refresh_tokens, users.role |
| `011_phase3_schema.sql` | organization_settings, teams, team_members, organization_invitations, organization_enrollment_keys, sync_jobs |

### Schema Overview

```
organizations
├── organization_settings (1:1)
├── users (1:N)
│   └── team_members (N:M with teams)
├── teams (1:N)
│   └── team_members (N:M with users)
├── machines (1:N)
│   └── sync_jobs (1:N)
├── sessions (1:N)
│   └── events (1:N)
├── organization_enrollment_keys (1:N)
├── organization_invitations (1:N)
└── api_keys (1:N)

daily_usage, daily_provider_usage, daily_model_usage,
daily_user_usage, daily_project_usage (aggregation tables)
```

## Seed Data System

### Development Seed

```bash
# Set up complete test environment
npm run dev:setup-org
```

This creates:
- **Organization:** AiInsight Test Org
- **Users:** owner, admin, member1-3 @ aiinsight.local (password: `password123`)
- **Teams:** Platform Team, AI Team, Security Team
- **Enrollment Keys:** 3 test keys
- **Machines:** 10 test machines (mix of OS)
- **Sessions:** 20 sample sessions
- **Events:** Sample events for all providers
- **Analytics:** Pre-aggregated daily usage data

### Running Seeds

```bash
# Full seed with all data
npx tsx scripts/seeds/seed-dev-org.ts

# Or use the wrapper
npm run dev:setup-org
```

### Seed Output

```
=================================
Test Organization Ready
=================================
Organization: AiInsight Test Org
Owner: owner@aiinsight.local
Password: password123

Enrollment Keys:
  Test Key 1: ai_live_xxxx_xxxxxxxxxxxxxxxx
  Test Key 2: ai_live_xxxx_xxxxxxxxxxxxxxxx
  Test Key 3: ai_live_xxxx_xxxxxxxxxxxxxxxx
=================================
```

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | None | Register user + org |
| POST | `/api/v1/auth/login` | None | Login |
| POST | `/api/v1/auth/refresh` | None | Refresh token |
| POST | `/api/v1/auth/logout` | JWT | Logout |

### Organizations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/organizations` | JWT | Create org |
| GET | `/api/v1/organizations/current` | JWT | Get current org |
| PATCH | `/api/v1/organizations/current` | JWT (admin+) | Update org |

### Teams

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/teams` | JWT | List teams |
| POST | `/api/v1/teams` | JWT (admin+) | Create team |
| PATCH | `/api/v1/teams/:id` | JWT (admin+) | Update team |
| DELETE | `/api/v1/teams/:id` | JWT (admin+) | Delete team |
| POST | `/api/v1/teams/:id/members` | JWT (admin+) | Add member |
| DELETE | `/api/v1/teams/:id/members/:userId` | JWT (admin+) | Remove member |

### Invitations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/invitations` | JWT (admin+) | Send invite |
| GET | `/api/v1/invitations` | JWT | List invites |
| POST | `/api/v1/invitations/accept` | None | Accept invite |
| DELETE | `/api/v1/invitations/:id` | JWT (admin+) | Revoke invite |
| POST | `/api/v1/invitations/:id/resend` | JWT (admin+) | Resend invite |

### Enrollment Keys

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/enrollment-keys` | JWT (admin+) | Generate key |
| GET | `/api/v1/enrollment-keys` | JWT | List keys |
| DELETE | `/api/v1/enrollment-keys/:id` | JWT (admin+) | Revoke key |
| POST | `/api/v1/enrollment-keys/:id/rotate` | JWT (admin+) | Rotate key |

### Agents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/agents/register` | Enrollment Key | Register agent |
| POST | `/api/v1/agents/heartbeat` | Agent Token | Heartbeat |
| GET | `/api/v1/agents` | JWT | List agents |
| GET | `/api/v1/agents/:id` | JWT | Get agent |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/dashboard/overview` | JWT | Overview stats |
| GET | `/api/v1/dashboard/providers` | JWT | Provider analytics |
| GET | `/api/v1/dashboard/models` | JWT | Model analytics |
| GET | `/api/v1/dashboard/users` | JWT | User analytics |
| GET | `/api/v1/dashboard/projects` | JWT | Project analytics |
| GET | `/api/v1/dashboard/trends` | JWT | Time series |
| GET | `/api/v1/dashboard/organization` | JWT | Org overview |
| GET | `/api/v1/dashboard/agents` | JWT | Agent dashboard |
| GET | `/api/v1/dashboard/sync-jobs` | JWT | Sync jobs |
| GET | `/api/v1/dashboard/onboarding` | JWT | Onboarding status |

### Ingestion (Protected)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/ingest/batch` | API Key / JWT | Batch upload |
| POST | `/api/v1/ingest/sessions` | API Key / JWT | Upload sessions |
| POST | `/api/v1/ingest/events` | API Key / JWT | Upload events |

## Testing the Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "organizationName": "My Org"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Use the Token

```bash
TOKEN=<your-jwt-token>

# Get current organization
curl http://localhost:3002/api/v1/organizations/current \
  -H "Authorization: Bearer $TOKEN"

# List teams
curl http://localhost:3002/api/v1/teams \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Generate Enrollment Key

```bash
curl -X POST http://localhost:3002/api/v1/enrollment-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Agent Key"}'
```

### 5. Register Agent

```bash
curl -X POST http://localhost:3002/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentKey": "<your-enrollment-key>",
    "hostname": "my-laptop",
    "os": "darwin",
    "architecture": "arm64",
    "agentVersion": "0.9.12"
  }'
```

### 6. Send Heartbeat

```bash
curl -X POST http://localhost:3002/api/v1/agents/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agentToken": "<your-agent-token>",
    "machineId": "<your-machine-id>"
  }'
```

## Docker Development

### Using Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and delete data
docker compose down -v
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL database |
| `ingestion-api` | 3001 | Data ingestion API |
| `dashboard-api` | 3002 | Analytics + auth API |
| `dashboard-web` | 3000 | Next.js web dashboard |

## Common Development Tasks

### Adding a New Migration

1. Create a new file in `apps/ingestion-api/src/database/migrations/`
2. Name it `NNN_description.sql` (e.g., `012_add_feature.sql`)
3. Run `npm run api:migrate`

### Adding a New API Endpoint

1. Create route in `apps/dashboard-api/src/routes/`
2. Create controller in `apps/dashboard-api/src/controllers/`
3. Create service in `apps/dashboard-api/src/services/` (if needed)
4. Register route in `apps/dashboard-api/src/index.ts`

### Adding a New Provider

1. Create provider file in `src/providers/`
2. Implement `Provider` interface
3. Register in `src/providers/index.ts`
4. Add tests

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset database
docker compose down -v
docker compose up -d
npm run api:migrate
npm run dev:setup-org
```

### Migration Failures

```bash
# Check migration status
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version"

# Manually mark migration as applied
psql $DATABASE_URL -c "INSERT INTO schema_migrations (version, filename) VALUES (11, '011_phase3_schema.sql')"
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules
npm install
npm run build
```

## License

PolyForm Free Trial License - see [LICENSE](../LICENSE) for details.
