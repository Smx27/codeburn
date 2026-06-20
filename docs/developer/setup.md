# Developer Setup

Local development setup for AIInsight.

## Prerequisites

- **Node.js** 22+ (required for `node:sqlite`)
- **PostgreSQL** 14+ (or use Docker)
- **npm** 10+ (workspaces support)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/priya/aiinsight.git
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

## Common Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run test suite (42 test files, 568 tests) |
| `npm run dev -- status` | Run CLI in dev mode |
| `npm run build` | Bundle and build CLI |
| `npm run bundle-litellm` | Refresh pricing snapshot |
| `docker compose up --build` | Build and start all cloud services |
| `docker compose down` | Stop all cloud services |
| `docker compose logs -f` | Tail logs from all services |

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/providers/codex.test.ts

# Run with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── providers/           # Provider-specific tests
├── sync-engine/         # Sync engine tests
├── analytics-engine/    # Analytics engine tests
├── dashboard-api/       # API tests
└── integration/         # Integration tests
```

### Writing Tests

- Each provider should have fixture-based tests under `tests/providers/`
- Use real JSONL fixtures, not mocked data
- Test both success and error cases

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

## Environment Variables

See [Configuration](../architecture/configuration.md) for complete list.

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
4. Add tests in `tests/providers/`

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

## Related Documentation

- [Architecture](../architecture/overview.md) — System design
- [Configuration](../architecture/configuration.md) — Environment variables
- [Repository Structure](repository-structure.md) — Package details
- [Release Process](release-process.md) — How to release
