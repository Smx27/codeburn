# Troubleshooting Guide

Common issues, causes, and step-by-step resolutions for AIInsight.

---

## Agent Registration Failed

### Symptoms
- Error: `Invalid or expired enrollment key`
- Agent cannot connect to dashboard
- Machine does not appear in agent list

### Possible Causes
- Enrollment key has expired (`expires_at` has passed)
- Enrollment key was revoked (deleted from `organization_enrollment_keys`)
- Key format is incorrect (not `ai_live_*` prefix)
- Key belongs to a different organization

### Resolution
1. Verify the key format starts with `ai_live_`
2. Check if the key exists and is not expired:
   ```sql
   SELECT id, name, prefix, expires_at, last_used_at
   FROM organization_enrollment_keys
   WHERE prefix = '<key_prefix>';
   ```
3. If the key is expired or missing, generate a new one from **Settings > Enrollment Keys**
4. Update the agent configuration with the new key
5. Restart the agent

### Prevention
- Set reasonable expiration dates on enrollment keys
- Use key rotation instead of creating new keys
- Keep a record of active keys per environment

---

## Historical Sync Stuck

### Symptoms
- Sync job shows status `running` for more than 1 hour
- Dashboard shows no new data after extended period
- Agent logs show repeated sync attempts

### Possible Causes
- Large dataset requiring extended processing time
- Network connectivity issues between agent and ingestion API
- Agent process crashed mid-sync without updating job status
- Ingestion API returning errors silently

### Resolution
1. Check sync job status:
   ```sql
   SELECT sj.id, sj.status, sj.started_at, sj.completed_at, sj.error_message
   FROM sync_jobs sj
   JOIN machines m ON sj.machine_id = m.id
   WHERE m.organization_id = '<ORG_ID>'
   ORDER BY sj.started_at DESC
   LIMIT 10;
   ```
2. Verify the agent is online:
   ```sql
   SELECT hostname, status, last_seen
   FROM machines WHERE organization_id = '<ORG_ID>';
   ```
3. If agent is offline, restart it and monitor the new sync job
4. If agent is online but sync is stuck, cancel the current sync and restart the agent
5. Check ingestion API logs for 4xx/5xx errors

### Prevention
- Monitor sync job durations for anomalies
- Set up alerts for sync jobs running longer than expected
- Ensure adequate network bandwidth for large datasets

---

## Machine Shows OFFLINE

### Symptoms
- Machine status shows `OFFLINE` in dashboard
- No heartbeat data received recently
- Agent token requests fail

### Possible Causes
- Agent process has stopped or crashed
- Network connectivity lost
- Machine is in sleep/hibernation mode
- Agent token has expired (90-day default)

### Resolution
1. Check last heartbeat time:
   ```sql
   SELECT hostname, status, last_seen, agent_version
   FROM machines WHERE id = '<MACHINE_ID>';
   ```
2. If `last_seen` is more than 10 minutes ago, the agent is likely offline
3. SSH into the machine and check if the agent process is running
4. Restart the agent if it has stopped
5. If the agent token expired, re-register the agent with a fresh enrollment key

### Prevention
- Configure agent as a system service for auto-restart
- Set up monitoring alerts for machines offline > 5 minutes
- Use systemd/launchd to keep the agent running

---

## Invitation Email Not Received

### Symptoms
- Invited user never receives the invitation email
- User cannot accept invitation via the link

### Possible Causes
- Mail provider (Resend/SMTP) not configured correctly
- Email blocked by spam/junk filter
- Incorrect email address on the invitation
- Mail provider rate limits hit

### Resolution
1. Check the invitation record:
   ```sql
   SELECT email, token, expires_at, accepted_at, created_at
   FROM organization_invitations
   WHERE organization_id = '<ORG_ID>'
   ORDER BY created_at DESC;
   ```
2. Verify the email address is correct
3. Check dashboard-api logs for mail sending errors
4. Verify mail provider configuration:
   - For Resend: `MAIL_PROVIDER=resend`, `RESEND_API_KEY` set
   - For SMTP: `MAIL_PROVIDER=smtp`, SMTP host/port/credentials set
5. Ask the user to check spam/junk folder
6. Use **Resend Invitation** to trigger a new email

### Prevention
- Verify mail provider configuration in staging before production
- Test invitation flow with a known-good email address
- Monitor mail delivery rates

---

## Dashboard Shows No Data

### Symptoms
- Dashboard overview shows zeros for all metrics
- No sessions, tokens, or cost data visible
- Charts are empty

### Possible Causes
- No agents registered to the organization
- Agents registered but sync has not completed
- No events ingested yet
- Analytics aggregation has not run

### Resolution
1. Check if agents are registered:
   ```sql
   SELECT hostname, status, first_seen, last_seen
   FROM machines WHERE organization_id = '<ORG_ID>';
   ```
2. Check if sync jobs have completed:
   ```sql
   SELECT status, COUNT(*) as count
   FROM sync_jobs sj
   JOIN machines m ON sj.machine_id = m.id
   WHERE m.organization_id = '<ORG_ID>'
   GROUP BY status;
   ```
3. Check if events exist in the database:
   ```sql
   SELECT COUNT(*) as event_count
   FROM events WHERE organization_id = '<ORG_ID>';
   ```
4. If no agents exist, register one using an enrollment key
5. If agents exist but no sync, verify agent is online and trigger a manual sync

### Prevention
- Complete the onboarding wizard to ensure initial setup
- Monitor agent health during the first 24 hours
- Set up alerts for zero-data conditions

---

## Analytics Missing or Incomplete

### Symptoms
- Some data appears but analytics are incomplete
- Provider or model breakdowns are missing
- Cost calculations seem incorrect

### Possible Causes
- Daily aggregation job has not run for some dates
- Data corruption in raw events table
- Provider metadata missing for some sessions

### Resolution
1. Check aggregation status:
   ```sql
   SELECT usage_date, total_sessions, total_tokens, total_cost
   FROM daily_usage
   WHERE organization_id = '<ORG_ID>'
   ORDER BY usage_date DESC
   LIMIT 14;
   ```
2. If dates are missing, trigger a manual backfill:
   ```
   POST /api/dashboard/backfill
   ```
3. Check for events without provider metadata:
   ```sql
   SELECT COUNT(*) FROM events e
   LEFT JOIN providers p ON e.provider_id = p.id
   WHERE e.organization_id = '<ORG_ID>' AND p.id IS NULL;
   ```
4. Review ingestion API logs for parsing errors

### Prevention
- Monitor aggregation job completion daily
- Set up alerts for failed aggregation runs
- Validate event payloads before ingestion

---

## Enrollment Key Invalid

### Symptoms
- Key rejected during agent registration
- Error: `Invalid or expired enrollment key`
- Key works in one environment but not another

### Possible Causes
- Key expired (check `expires_at`)
- Key was revoked (deleted from database)
- Key belongs to a different organization
- Key prefix does not match (copy/paste error)

### Resolution
1. Look up the key prefix in the database:
   ```sql
   SELECT id, name, prefix, organization_id, expires_at
   FROM organization_enrollment_keys
   WHERE prefix LIKE '<first_20_chars>%';
   ```
2. Verify the key is associated with the correct organization
3. If the key is expired or revoked, generate a new one:
   - Navigate to **Settings > Enrollment Keys**
   - Click **Generate New Key**
   - Copy the full key immediately (shown only once)
4. Update the agent configuration with the new key

### Prevention
- Document which keys are used for which environments
- Use descriptive names for enrollment keys (e.g., "production-backend", "staging-test")
- Set calendar reminders for key expiration

---

## Authentication Issues

### Symptoms
- Cannot log in to dashboard
- Error: `Invalid credentials`
- Error: `Invalid or expired refresh token`
- Logged out unexpectedly

### Possible Causes
- Incorrect email or password
- Refresh token has expired (30-day default)
- Refresh token was invalidated (password change, logout)
- Account does not exist

### Resolution
1. Verify the user exists:
   ```sql
   SELECT id, email, name, role, email_verified, last_login_at
   FROM users WHERE email = '<email>';
   ```
2. For `Invalid credentials`:
   - Confirm the email address is correct
   - Use **Forgot Password** to reset the password
   - Password must be at least 8 characters
3. For expired refresh tokens:
   - Clear browser storage (localStorage, cookies)
   - Log in again with email/password
4. If the account was invited, verify the invitation was accepted:
   ```sql
   SELECT email, accepted_at, expires_at
   FROM organization_invitations
   WHERE email = '<email>';
   ```

### Prevention
- Implement session persistence in the frontend
- Use remember-me functionality for trusted devices
- Monitor failed login attempts for security

---

## General Debugging Steps

1. **Check the logs**: Review dashboard-api and ingestion-api logs for error messages
2. **Verify database connectivity**: Ensure the application can connect to PostgreSQL
3. **Check environment variables**: Verify all required env vars are set correctly
4. **Test API endpoints directly**: Use curl or Postman to test individual endpoints
5. **Review recent migrations**: Ensure all migrations have been applied:
   ```sql
   SELECT name, applied_at FROM schema_migrations ORDER BY applied_at DESC;
   ```
6. **Check service health**: Verify dashboard-api, ingestion-api, and PostgreSQL are running
