# Common Problems

Common issues and solutions for AIInsight.

## Agent Issues

### Agent Won't Connect

**Symptoms:**
- Agent registration fails with "Connection refused"
- Agent shows "Disconnected" in dashboard
- Sync jobs never start

**Solutions:**

1. **Check network connectivity**
   ```bash
   curl -I https://api.aiinsight.dev/health
   ```

2. **Verify API key**
   ```bash
   aiinsight login
   ```

3. **Check firewall/proxy settings**

   Ensure these domains are accessible:
   | Domain | Port | Purpose |
   |--------|------|---------|
   | `api.aiinsight.dev` | 443 | API communication |
   | `ingest.aiinsight.dev` | 443 | Data upload |

4. **Verify agent version**
   ```bash
   aiinsight --version
   ```

5. **Update agent**
   ```bash
   npm update -g aiinsight
   ```

### Sync Not Starting

**Symptoms:**
- Agent is connected but no data appears in dashboard
- Sync status shows "Pending" indefinitely
- Historical data not uploading

**Solutions:**

1. **Verify AI coding tool has session data**
   ```bash
   # Check Claude sessions exist
   ls ~/.claude/projects/*/sessions/*.jsonl

   # Check Codex sessions exist
   ls ~/.codex/sessions/*/*/*.jsonl

   # Check Cursor database exists
   ls ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb
   ```

2. **Check agent registration**
   ```bash
   aiinsight status
   ```

3. **Verify API key permissions**

   Ensure the API key has not been revoked or expired in **Settings → API Keys**.

4. **Manual sync trigger**
   ```bash
   aiinsight sync --force
   ```

5. **Check provider detection**
   ```bash
   aiinsight providers
   ```

### Agent Shows "OFFLINE"

**Symptoms:**
- Agent shows "OFFLINE" in dashboard
- No recent sync jobs

**Solutions:**

1. **Check agent is running**
   ```bash
   aiinsight status
   ```

2. **Restart agent**
   ```bash
   aiinsight sync
   ```

3. **Check network connectivity**

4. **Verify API key is valid**

## Authentication Issues

### Login Issues

**Symptoms:**
- "Invalid credentials" error
- Cannot log in after password reset
- Session expires immediately

**Solutions:**

1. **Verify email and password**

2. **Reset password**
   1. Go to login page
   2. Click "Forgot Password"
   3. Check email for reset link
   4. Create new password

3. **Check account status**

   Account may be locked after too many failed attempts. Wait 15 minutes.

4. **Clear browser cache**
   ```
   - Local Storage
   - Session Storage
   - Cookies for app.aiinsight.dev
   ```

### API Key Problems

**Symptoms:**
- 401 Unauthorized with API key
- API key not working after creation
- "Invalid API key" error

**Solutions:**

1. **Verify API key format**

   Keys must start with `aisk_` or `cb_`:
   ```
   aisk_your_api_key_here
   cb_your_api_key_here
   ```

2. **Check key prefix**
   ```bash
   # Using Authorization header
   curl http://localhost:3002/api/v1/dashboard/overview \
     -H "Authorization: Bearer aisk_your_key"

   # Or using X-API-Key header
   curl http://localhost:3002/api/v1/dashboard/overview \
     -H "X-API-Key aisk_your_key"
   ```

3. **Verify key is not revoked**

   Check API key status in **Settings → API Keys**.

4. **Generate a new key**

   If key is compromised, revoke and create new one.

### Email Not Received

**Symptoms:**
- Verification email never arrives
- Invitation email not received
- Password reset email missing

**Solutions:**

1. **Check spam/junk folder**

2. **Verify email address is correct**

3. **Resend the email**

4. **Check SMTP configuration** (self-hosted)

5. **Check organization email settings**

## Dashboard Issues

### Dashboard Not Loading Data

**Symptoms:**
- Dashboard shows "No data available"
- Charts are empty
- Metrics show $0.00

**Solutions:**

1. **Check agent sync status**

   Navigate to **Settings → Agents** to verify agents are connected.

2. **Verify data exists**
   ```bash
   curl http://localhost:3002/api/v1/dashboard/overview \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Check aggregation status**

   Analytics data is aggregated hourly. Recent data may not appear immediately.

4. **Verify date range**

   Ensure you're viewing the correct date range.

5. **Check organization membership**

   Ensure you're viewing the correct organization's dashboard.

### Dashboard Loading Slowly

**Symptoms:**
- Dashboard takes long time to load
- Charts are slow to render

**Solutions:**

1. **Reduce date range**

2. **Clear browser cache**

3. **Check network connectivity**

4. **Update browser**

## Performance Issues

### Sync Takes Too Long

**Symptoms:**
- Sync runs for a long time
- Sync times out

**Solutions:**

1. **Reduce sync frequency**
   ```bash
   aiinsight config set sync-interval 3600
   ```

2. **Limit provider scope**
   ```bash
   aiinsight sync --providers claude,codex
   ```

3. **Check system resources**
   ```bash
   df -h
   free -m
   ```

4. **Update agent**
   ```bash
   npm update -g aiinsight
   ```

### Dashboard Slow

**Symptoms:**
- Dashboard loads slowly
- Charts take time to render

**Solutions:**

1. **Reduce date range**

2. **Check database performance**

3. **Verify API response times**

4. **Clear browser cache**

## Getting Help

If your issue isn't resolved:

1. Check [GitHub Issues](https://github.com/getagentseal/codeburn/issues) for known issues
2. Join [Discord community](https://discord.gg/w2sw8mCqep) for support
3. Open a new issue with:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Agent version (`aiinsight --version`)
   - Operating system and version

## Related Documentation

- [Troubleshooting](../getting-started/troubleshooting.md) — Detailed troubleshooting guide
- [FAQ](../getting-started/faq.md) — Common questions
- [Support Runbook](runbook.md) — Internal support reference
- [Incident Response](incident-response.md) — Incident handling
