# Backup and Restore

Database backup and restore procedures for AIInsight.

## Backup

### PostgreSQL

```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables
pg_dump $DATABASE_URL -t sessions -t events > partial_backup.sql
```

### Docker

```bash
# Backup from Docker
docker compose exec postgres pg_dump -U aiinsight aiinsight > backup.sql

# Backup with timestamp
docker compose exec postgres pg_dump -U aiinsight aiinsight | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Automated Backup

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/aiinsight && docker compose exec -T postgres pg_dump -U aiinsight aiinsight | gzip > /backups/aiinsight_$(date +\%Y\%m\%d).sql.gz
```

## Restore

### PostgreSQL

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

### Docker

```bash
# Restore to Docker
cat backup.sql | docker compose exec -T postgres psql -U aiinsight aiinsight

# Restore from compressed backup
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U aiinsight aiinsight
```

## Partial Restore

### Restore Specific Tables

```bash
# Restore only sessions and events
psql $DATABASE_URL < partial_backup.sql
```

### Restore to Specific Schema

```bash
# Create restore schema
psql $DATABASE_URL -c "CREATE SCHEMA IF NOT EXISTS restore;"

# Restore to schema
pg_restore --schema=restore -d $DATABASE_URL backup.dump
```

## Point-in-Time Recovery

For PostgreSQL with WAL archiving:

1. Configure WAL archiving in `postgresql.conf`
2. Use `pg_basebackup` for base backups
3. Use `pg_replay` for point-in-time recovery

## Verification

After restore, verify data integrity:

```bash
# Check table counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM events;"

# Check recent data
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM sessions;"
```

## Best Practices

1. **Test restores regularly** — Ensure backups are valid
2. **Keep multiple backups** — Retain at least 7 days
3. **Store backups offsite** — Use S3, GCS, or similar
4. **Monitor backup jobs** — Alert on failures
5. **Document recovery procedures** — Keep runbook updated

## Related Documentation

- [Deployment](deployment.md) — Production deployment
- [Docker](docker.md) — Docker configuration
- [Disaster Recovery](disaster-recovery.md) — Disaster recovery procedures
