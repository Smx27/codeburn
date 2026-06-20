# Support Runbook

Internal reference for diagnosing and resolving customer issues.

## Identifying Sync Failures

### Check sync_jobs Table

```sql
SELECT
  sj.id,
  sj.status,
  sj.started_at,
  sj.completed_at,
  sj.error_message,
  m.hostname,
  m.status as machine_status
FROM sync_jobs sj
JOIN machines m ON sj.machine_id = m.id
WHERE m.organization_id = '<ORG_ID>'
ORDER BY sj.started_at DESC
LIMIT 20;
```

### Status Values
- `running` — Sync in progress
- `completed` — Sync finished successfully
- `failed` — Sync encountered an error
- `pending` — Sync queued but not started

### Common Sync Errors
| Error | Cause | Resolution |
|-------|-------|------------|
| Network timeout | Agent cannot reach ingestion API | Check network connectivity, firewall rules |
| Disk full on agent | Agent cannot read local files | Free disk space on the machine |
| Invalid data format | Corrupted local session files | Re-run sync after clearing cache |
| Auth failure | Agent token expired | Re-register agent with fresh enrollment key |

## Identifying Ingestion Failures

### Check Ingestion API Logs

```bash
# Filter for error responses
docker logs ingestion-api 2>&1 | grep -E '"status":[45][0-9]{2}'

# Check recent errors
docker logs --since 1h ingestion-api 2>&1 | grep -i error
```

### Common Ingestion Errors
| HTTP Status | Error | Resolution |
|-------------|-------|------------|
| 400 | Invalid payload format | Check agent version, update if outdated |
| 401 | Authentication failure | Verify agent token is valid |
| 413 | Payload too large | Split sync into smaller batches |
| 429 | Rate limit exceeded | Reduce sync frequency, implement backoff |
| 500 | Server error | Check ingestion API logs, restart if needed |

## Verifying Agent Registration

### List All Agents for an Organization

```sql
SELECT
  m.id,
  m.hostname,
  m.os,
  m.architecture,
  m.agent_version,
  m.status,
  m.first_seen,
  m.last_seen,
  m.enrollment_key_id
FROM machines m
WHERE m.organization_id = '<ORG_ID>'
ORDER BY m.last_seen DESC;
```

### Check Agent Token Status

```sql
SELECT
  at.id,
  at.machine_id,
  at.created_at,
  at.expires_at,
  at.last_used_at,
  m.hostname
FROM agent_tokens at
JOIN machines m ON at.machine_id = m.id
WHERE m.organization_id = '<ORG_ID>'
ORDER BY at.created_at DESC;
```

### Verify Enrollment Key Usage

```sql
SELECT
  oek.id,
  oek.name,
  oek.prefix,
  oek.expires_at,
  oek.last_used_at,
  oek.created_at
FROM organization_enrollment_keys oek
WHERE oek.organization_id = '<ORG_ID>'
ORDER BY oek.created_at DESC;
```

## Inspecting Machine Health

### Machine Health Overview

```sql
SELECT
  m.hostname,
  m.os,
  m.status,
  m.first_seen,
  m.last_seen,
  EXTRACT(EPOCH FROM (NOW() - m.last_seen)) / 60 AS minutes_since_last_seen,
  COUNT(sj.id) AS total_syncs,
  COUNT(CASE WHEN sj.status = 'failed' THEN 1 END) AS failed_syncs,
  COUNT(CASE WHEN sj.status = 'completed' THEN 1 END) AS completed_syncs
FROM machines m
LEFT JOIN sync_jobs sj ON sj.machine_id = m.id
WHERE m.organization_id = '<ORG_ID>'
GROUP BY m.id
ORDER BY m.last_seen DESC;
```

### Machines with High Failure Rates

```sql
SELECT
  m.hostname,
  m.status,
  COUNT(sj.id) AS total_syncs,
  COUNT(CASE WHEN sj.status = 'failed' THEN 1 END) AS failed_syncs,
  ROUND(
    COUNT(CASE WHEN sj.status = 'failed' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(sj.id), 0) * 100, 1
  ) AS failure_rate_pct
FROM machines m
JOIN sync_jobs sj ON sj.machine_id = m.id
WHERE m.organization_id = '<ORG_ID>'
GROUP BY m.id
HAVING COUNT(sj.id) > 0
ORDER BY failure_rate_pct DESC;
```

## Troubleshooting Invitations

### List All Invitations

```sql
SELECT
  oi.id,
  oi.email,
  oi.role,
  oi.token,
  oi.expires_at,
  oi.accepted_at,
  oi.created_at,
  CASE
    WHEN oi.accepted_at IS NOT NULL THEN 'accepted'
    WHEN oi.expires_at < NOW() THEN 'expired'
    ELSE 'pending'
  END AS status
FROM organization_invitations oi
WHERE oi.organization_id = '<ORG_ID>'
ORDER BY oi.created_at DESC;
```

### Find Pending Invitations

```sql
SELECT email, role, expires_at, created_at
FROM organization_invitations
WHERE organization_id = '<ORG_ID>'
  AND accepted_at IS NULL
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

### Invitations Expiring Soon (within 24 hours)

```sql
SELECT email, role, expires_at
FROM organization_invitations
WHERE organization_id = '<ORG_ID>'
  AND accepted_at IS NULL
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours';
```

## Troubleshooting Onboarding

### Check Onboarding Progress

```sql
-- Organization created
SELECT COUNT(*) > 0 AS organization_created
FROM organizations WHERE id = '<ORG_ID>';

-- Enrollment key generated
SELECT COUNT(*) > 0 AS key_generated
FROM organization_enrollment_keys WHERE organization_id = '<ORG_ID>';

-- Agent installed
SELECT COUNT(*) > 0 AS agent_installed
FROM machines WHERE organization_id = '<ORG_ID>';

-- Sync running or completed
SELECT
  COUNT(CASE WHEN status = 'running' THEN 1 END) AS sync_running,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS sync_completed
FROM sync_jobs
WHERE machine_id IN (SELECT id FROM machines WHERE organization_id = '<ORG_ID>');

-- Team members invited
SELECT COUNT(*) > 0 AS members_invited
FROM organization_invitations
WHERE organization_id = '<ORG_ID>' AND accepted_at IS NULL;
```

### Identify Incomplete Steps

| Step | Check | Incomplete If |
|------|-------|---------------|
| Organization | `organizations` row exists | No row for org ID |
| Enrollment Key | `organization_enrollment_keys` has rows | Zero keys |
| Agent | `machines` has rows | Zero machines |
| Sync | `sync_jobs` has completed rows | No completed syncs |
| Team | `organization_invitations` has rows | No invitations sent |

## Customer Issue Resolution

### Common Issues and Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Cannot log in | Verify email, reset password |
| No data on dashboard | Check agent is online, trigger manual sync |
| Invited user can't join | Resend invitation, check email spam |
| Agent won't register | Verify enrollment key format, generate new key |
| Dashboard is slow | Check date range, reduce to 7-day window |
| Cost data looks wrong | Verify provider pricing config, re-run aggregation |

### Escalation Procedures

1. **Level 1 (Support):** Check runbook, query database, provide resolution
2. **Level 2 (Engineering):** If issue persists, collect logs and escalate with:
   - Organization ID
   - Machine ID (if applicable)
   - Timestamp of issue
   - Error messages from logs
   - Steps already attempted

### Information to Collect

Before escalating, gather:
```sql
-- Organization details
SELECT id, name, created_at FROM organizations WHERE id = '<ORG_ID>';

-- Recent user activity
SELECT email, last_login_at FROM users WHERE organization_id = '<ORG_ID>';

-- Agent status
SELECT hostname, status, last_seen FROM machines WHERE organization_id = '<ORG_ID>';

-- Recent sync jobs
SELECT status, started_at, completed_at, error_message
FROM sync_jobs
WHERE machine_id IN (SELECT id FROM machines WHERE organization_id = '<ORG_ID>')
ORDER BY started_at DESC LIMIT 10;
```

## Communication Templates

### Agent Offline Notification
> Your agent on **{hostname}** has been offline since **{last_seen}**. Please restart the agent on the machine to resume data collection.

### Sync Stuck Notification
> A sync job on **{hostname}** has been running for over **{duration}**. This may indicate a network issue or large dataset. The sync will be automatically cancelled after 2 hours.

### Invitation Expiring
> Your invitation to **{email}** expires on **{expires_at}**. If they haven't accepted, consider resending the invitation or generating a new one.

## Related Documentation

- [Common Problems](common-problems.md) — Common issues and solutions
- [Incident Response](incident-response.md) — Incident handling procedures
- [Email Templates](email-templates.md) — Communication templates
