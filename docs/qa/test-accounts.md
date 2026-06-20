# Test Accounts

Test accounts and data for QA testing.

## Test Organizations

| Organization | Owner | Plan |
|--------------|-------|------|
| AiInsight Test Org | owner@aiinsight.local | Free |

## Test Users

| Email | Password | Role | Organization |
|-------|----------|------|--------------|
| owner@aiinsight.local | password123 | Owner | AiInsight Test Org |
| admin@aiinsight.local | password123 | Admin | AiInsight Test Org |
| member1@aiinsight.local | password123 | Member | AiInsight Test Org |
| member2@aiinsight.local | password123 | Member | AiInsight Test Org |
| member3@aiinsight.local | password123 | Member | AiInsight Test Org |

## Test Teams

| Team | Members |
|------|---------|
| Platform Team | owner, member1 |
| AI Team | owner, member2 |
| Security Team | owner, member3 |

## Test API Keys

| Name | Role | Key |
|------|------|-----|
| Test Key 1 | write | `aisk_test_key_1` |
| Test Key 2 | read | `aisk_test_key_2` |
| Test Key 3 | admin | `aisk_test_key_3` |

## Test Enrollment Keys

| Name | Key |
|------|-----|
| Test Enrollment 1 | `ai_live_test_key_1` |
| Test Enrollment 2 | `ai_live_test_key_2` |
| Test Enrollment 3 | `ai_live_test_key_3` |

## Test Machines

| Hostname | OS | Architecture | Status |
|----------|-----|--------------|--------|
| test-macbook | darwin | arm64 | ONLINE |
| test-imac | darwin | x64 | ONLINE |
| test-ubuntu | linux | x64 | ONLINE |
| test-windows | win32 | x64 | OFFLINE |

## Test Sessions

| Provider | Project | Events | Tokens | Cost |
|----------|---------|--------|--------|------|
| claude | my-app | 15 | 25000 | $0.50 |
| codex | backend | 10 | 15000 | $0.30 |
| cursor | frontend | 8 | 10000 | $0.20 |
| gemini | utils | 5 | 8000 | $0.15 |

## Setting Up Test Data

### Using Seed Script

```bash
npm run dev:setup-org
```

This creates:
- Organization: AiInsight Test Org
- Users: owner, admin, member1-3
- Teams: Platform, AI, Security
- API Keys: 3 test keys
- Enrollment Keys: 3 test keys
- Machines: 10 test machines
- Sessions: 20 sample sessions
- Events: Sample events for all providers

### Manual Setup

```bash
# Start services
docker compose up -d

# Run migrations
npm run api:migrate

# Seed data
npx tsx scripts/seeds/seed-dev-org.ts
```

## Cleanup

### Delete Test Data

```bash
# Reset database
docker compose down -v
docker compose up -d
npm run api:migrate
npm run dev:setup-org
```

### Remove Specific Data

```sql
-- Remove test organization
DELETE FROM organizations WHERE name = 'AiInsight Test Org';

-- Remove test users
DELETE FROM users WHERE email LIKE '%@aiinsight.local';
```

## Related Documentation

- [Manual Test Guide](manual-test-guide.md) — Manual testing procedures
- [Smoke Test](smoke-test.md) — Quick verification tests
- [Setup](../developer/setup.md) — Local development setup
