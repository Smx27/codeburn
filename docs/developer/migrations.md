# Migrations

Database migration system for AIInsight.

## Overview

AIInsight uses SQL-based migrations stored in `apps/ingestion-api/src/database/migrations/`.

## Running Migrations

```bash
# Run all pending migrations
npm run api:migrate

# Or directly
npx tsx apps/ingestion-api/src/database/migrate.ts
```

## Migration Files

| Migration | Tables | Description |
|-----------|--------|-------------|
| `001_initial_schema.sql` | organizations, users, machines, providers | Initial schema |
| `002_sessions_events.sql` | sessions, events | Session and event storage |
| `003_sync_tracking.sql` | sync_sources, sync_state | Sync state tracking |
| `004_aggregation_runs.sql` | aggregation_runs | Aggregation job tracking |
| `005_daily_usage.sql` | daily_usage | Org-level daily summary |
| `006_daily_provider_usage.sql` | daily_provider_usage | Per-provider summary |
| `007_daily_model_usage.sql` | daily_model_usage | Per-model summary |
| `008_daily_user_usage.sql` | daily_user_usage | Per-user summary |
| `009_daily_project_usage.sql` | daily_project_usage | Per-project summary |
| `010_auth.sql` | api_keys, refresh_tokens, users.role | Authentication |
| `011_phase3_schema.sql` | organization_settings, teams, team_members, organization_invitations, organization_enrollment_keys, sync_jobs | Organization features |
| `012_phase3.5_auth.sql` | email_verifications, password_resets | Email verification |
| `013_agent_tokens.sql` | agent_tokens | Agent authentication |
| `014_sessions_indexes.sql` | — | Performance indexes |

## Schema Overview

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

## Adding a New Migration

1. Create a new file in `apps/ingestion-api/src/database/migrations/`
2. Name it `NNN_description.sql` (e.g., `015_add_feature.sql`)
3. Use `CREATE TABLE IF NOT EXISTS` for idempotency
4. Run `npm run api:migrate`

### Example

```sql
-- 015_add_feature.sql
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_new_table_organization_id ON new_table(organization_id);
```

## Checking Migration Status

```bash
# Check applied migrations
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version"
```

## Troubleshooting

### Migration Fails

1. Check database connectivity
2. Verify previous migrations completed successfully
3. Check for syntax errors in SQL
4. Ensure required extensions are installed

### Manually Mark Migration as Applied

```bash
psql $DATABASE_URL -c "INSERT INTO schema_migrations (version, filename) VALUES (15, '015_add_feature.sql')"
```

### Rollback

AIInsight migrations do not include rollback scripts. To undo a migration:

1. Manually drop the table/column
2. Remove the migration from `schema_migrations`

## Related Documentation

- [Setup](setup.md) — Local development setup
- [Environment](environment.md) — Environment variables
- [Deployment](../operations/deployment.md) — Production deployment
