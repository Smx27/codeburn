# Disaster Recovery

Disaster recovery procedures for AIInsight.

## Scenarios

### 1. Database Corruption

**Symptoms:**
- Data inconsistencies
- Query errors
- Missing data

**Recovery:**
1. Stop all services
2. Restore from latest backup
3. Verify data integrity
4. Restart services

```bash
# Stop services
docker compose down

# Restore database
psql $DATABASE_URL < latest_backup.sql

# Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# Start services
docker compose up -d
```

### 2. Service Failure

**Symptoms:**
- Service unhealthy
- High error rate
- Performance degradation

**Recovery:**
1. Check service logs
2. Restart failed service
3. If persistent, redeploy

```bash
# Check logs
docker compose logs ingestion-api

# Restart service
docker compose restart ingestion-api

# Redeploy if needed
docker compose up --build -d ingestion-api
```

### 3. Disk Failure

**Symptoms:**
- Write errors
- Full disk
- Service crashes

**Recovery:**
1. Stop services
2. Mount new disk
3. Restore from backup
4. Restart services

### 4. Network Outage

**Symptoms:**
- Connection refused
- Timeout errors
- Sync failures

**Recovery:**
1. Verify network connectivity
2. Check firewall rules
3. Restart services after network restored

### 5. Security Breach

**Symptoms:**
- Unauthorized access
- Data exfiltration
- Suspicious activity

**Recovery:**
1. Immediately revoke all API keys
2. Change all passwords
3. Review access logs
4. Restore from clean backup if needed
5. Notify affected users

## Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database corruption | 1 hour | 24 hours |
| Service failure | 5 minutes | 0 |
| Disk failure | 2 hours | 24 hours |
| Network outage | 30 minutes | 0 |
| Security breach | 4 hours | 24 hours |

## Backup Strategy

### Daily Backups

- Full database backup at 2 AM UTC
- Retain for 30 days
- Store in multiple locations

### Weekly Backups

- Full system backup
- Retain for 12 weeks
- Archive to cold storage

### Monthly Backups

- Full system backup
- Retain for 12 months
- Archive to cold storage

## Communication Plan

### Internal

1. Alert on-call engineer
2. Notify team via Slack
3. Update status page

### External

1. Update status page
2. Send email notification
3. Post to social media (if major outage)

## Testing

### Quarterly DR Tests

1. Restore from backup to staging environment
2. Verify data integrity
3. Test application functionality
4. Document results

### Annual Full DR Test

1. Simulate complete failure
2. Execute full recovery procedure
3. Verify all systems operational
4. Update DR documentation

## Related Documentation

- [Backup and Restore](backup-and-restore.md) — Backup procedures
- [Deployment](deployment.md) — Production deployment
- [Health Checks](health-checks.md) — Health check endpoints
