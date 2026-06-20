# Upgrade Process

Upgrade procedures for AIInsight.

## Overview

AIInsight follows semantic versioning. Upgrade procedures depend on the version change.

## Upgrading the CLI

### Patch Version (1.0.0 → 1.0.1)

```bash
# npm
npm update -g aiinsight

# Homebrew
brew upgrade aiinsight

# Curl installer
curl -fsSL https://get.aiinsight.dev/install.sh | bash
```

### Minor Version (1.0.x → 1.1.0)

Same as patch upgrade. Check changelog for new features.

### Major Version (1.x.x → 2.0.0)

1. Check breaking changes in changelog
2. Update configuration if needed
3. Test in staging environment first
4. Upgrade CLI

## Upgrading Cloud Services

### Docker Compose

```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up --build -d

# Run migrations
docker compose exec ingestion-api npm run migrate

# Verify
curl http://localhost:3002/api/v1/health
```

### Manual Deployment

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Run migrations
npm run api:migrate

# Restart services
pm2 restart all
```

## Database Migrations

### Automatic Migrations

Docker Compose runs migrations automatically on startup:

```yaml
command: sh -c "npm run migrate && node dist/index.js"
```

### Manual Migrations

```bash
# Run pending migrations
npm run api:migrate

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version"
```

## Rollback

### CLI Rollback

```bash
# Install previous version
npm install -g aiinsight@1.0.0
```

### Cloud Services Rollback

```bash
# Checkout previous version
git checkout v1.0.0

# Rebuild
npm install
npm run build

# Run migrations (if needed)
npm run api:migrate

# Restart
docker compose up --build -d
```

## Pre-Upgrade Checklist

- [ ] Review changelog for breaking changes
- [ ] Test in staging environment
- [ ] Backup database
- [ ] Notify team of upgrade window
- [ ] Monitor logs during upgrade
- [ ] Verify health checks after upgrade

## Post-Upgrade Verification

1. Check all services are healthy
2. Verify API endpoints respond
3. Test critical user flows
4. Monitor error rates
5. Review logs for issues

## Related Documentation

- [Deployment](deployment.md) — Production deployment
- [Docker](docker.md) — Docker configuration
- [Migrations](../developer/migrations.md) — Database migrations
