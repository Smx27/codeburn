# Troubleshooting

Common issues and solutions for AIInsight Cloud and the CLI agent.

## Agent Won't Connect

### Symptoms

- Agent registration fails with "Connection refused"
- Agent shows "Disconnected" in dashboard
- Sync jobs never start

### Solutions

**1. Check network connectivity**

```bash
# Test API connectivity
curl -I https://api.aiinsight.dev/health
```

**2. Verify API key**

```bash
# Ensure the key is valid and not revoked
aiinsight login
```

Check the key status in **Settings → API Keys** in the dashboard.

**3. Check firewall/proxy settings**

If you're behind a corporate firewall, ensure these domains are accessible:

| Domain | Port | Purpose |
|--------|------|---------|
| `api.aiinsight.dev` | 443 | API communication |
| `ingest.aiinsight.dev` | 443 | Data upload |

**4. Verify agent version**

```bash
aiinsight --version
```

Update to the latest version if needed:

```bash
npm update -g aiinsight
```

**5. Check agent logs**

```bash
# Enable verbose logging
aiinsight login --verbose
```

See [Install Agent](install-agent.md) for detailed setup instructions.

## Sync Not Starting

### Symptoms

- Agent is connected but no data appears in dashboard
- Sync status shows "Pending" indefinitely
- Historical data not uploading

### Solutions

**1. Verify AI coding tool has session data**

```bash
# Check Claude sessions exist
ls ~/.claude/projects/*/sessions/*.jsonl

# Check Codex sessions exist
ls ~/.codex/sessions/*/*/*.jsonl

# Check Cursor database exists
ls ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb
```

**2. Check agent registration**

```bash
aiinsight status
```

The output should show the agent is registered and connected.

**3. Verify API key permissions**

Ensure the API key has not been revoked or expired in **Settings → API Keys**.

**4. Check sync job status**

Navigate to **Settings → Agents → Sync Status** in the dashboard to view active and completed sync jobs.

**5. Manual sync trigger**

```bash
# Force a sync
aiinsight sync --force
```

**6. Check provider detection**

```bash
# List detected providers
aiinsight providers
```

## Email Not Received

### Symptoms

- Verification email never arrives
- Invitation email not received
- Password reset email missing

### Solutions

**1. Check spam/junk folder**

Transactional emails are sometimes filtered as spam.

**2. Verify email address**

Ensure the email address is correct in your account settings.

**3. Resend the email**

**Verification:**
1. Log in to the dashboard
2. Navigate to **Settings → Account**
3. Click **Resend Verification**

**Invitation:**
1. Go to **Settings → Team → Invitations**
2. Find the pending invitation
3. Click **Resend**

**Password Reset:**
1. Go to the login page
2. Click **Forgot Password**
3. Enter your email address

**4. Check SMTP configuration**

If self-hosting, verify SMTP settings in your environment variables.

**5. Check organization email settings**

Ensure the sender domain (`aiinsight.dev`) is not blocked by your email provider.

## Login Issues

### Symptoms

- "Invalid credentials" error
- Cannot log in after password reset
- Session expires immediately

### Solutions

**1. Verify email and password**

Ensure you're using the correct email address and password.

**2. Reset password**

1. Go to the login page
2. Click **Forgot Password**
3. Check your email for the reset link
4. Create a new password

**3. Check account status**

Your account may be locked after too many failed login attempts. Wait 15 minutes and try again, or contact support.

**4. Clear browser cache**

```bash
# In browser dev tools, clear:
# - Local Storage
# - Session Storage
# - Cookies for app.aiinsight.dev
```

**5. Check JWT token validity**

If you're using API keys, ensure they haven't expired:

```bash
curl http://localhost:3002/api/v1/auth/me \
  -H "Authorization: Bearer $YOUR_JWT_TOKEN"
```

## API Key Problems

### Symptoms

- 401 Unauthorized with API key
- API key not working after creation
- "Invalid API key" error

### Solutions

**1. Verify API key format**

API keys must start with `aisk_` or `cb_`:

```
aisk_your_api_key_here
cb_your_api_key_here
```

**2. Check key prefix**

Ensure you're using the correct authentication header:

```bash
# Using Authorization header
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "Authorization: Bearer aisk_your_key"

# Or using X-API-Key header
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "X-API-Key aisk_your_key"
```

**3. Verify key is not revoked**

Check API key status in **Settings → API Keys**.

**4. Generate a new key**

If the key is compromised or not working, revoke it and create a new one:

```bash
curl -X POST http://localhost:3002/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New API Key"}'
```

**5. Check key permissions**

API keys inherit the permissions of the user who created them. Ensure the user has the necessary role.

## Dashboard Not Loading Data

### Symptoms

- Dashboard shows "No data available"
- Charts are empty
- Metrics show $0.00

### Solutions

**1. Check agent sync status**

Navigate to **Settings → Agents** to verify agents are connected and syncing.

**2. Verify data exists**

```bash
# Check if data is in the database
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "Authorization: Bearer $TOKEN"
```

**3. Check aggregation status**

Analytics data is aggregated hourly. Recent data may not appear immediately.

**4. Verify date range**

Ensure you're viewing the correct date range in the dashboard (Today, 7 Days, 30 Days, etc.).

**5. Check organization membership**

Ensure you're viewing the correct organization's dashboard if you belong to multiple organizations.

**6. Verify API connectivity**

```bash
# Test dashboard API
curl http://localhost:3002/api/v1/health

# Test with authentication
curl http://localhost:3002/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Performance Issues

### Symptoms

- Dashboard loads slowly
- Sync takes too long
- High memory usage

### Solutions

**1. Reduce sync frequency**

If syncing too often, increase the sync interval:

```bash
aiinsight config set sync-interval 3600  # Sync every hour
```

**2. Limit provider scope**

Sync only the providers you need:

```bash
aiinsight sync --providers claude,codex
```

**3. Check system resources**

Ensure sufficient disk space and memory:

```bash
df -h
free -m
```

**4. Update agent**

Older versions may have performance issues:

```bash
npm update -g aiinsight
```

## Getting Help

If your issue isn't resolved:

1. Check the [GitHub Issues](https://github.com/getagentseal/codeburn/issues) for known issues
2. Join the [Discord community](https://discord.gg/w2sw8mCqep) for support
3. Open a new issue with:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Agent version (`aiinsight --version`)
   - Operating system and version

## Related Documentation

- [Getting Started](getting-started.md) — Initial setup walkthrough
- [Install Agent](install-agent.md) — Platform-specific install details
- [CLI Reference](../cli/command-reference.md) — All CLI commands
- [FAQ](faq.md) — Common questions
