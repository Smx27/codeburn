# Privacy & Security

AIInsight is designed with privacy and security as core principles.

## No Prompt Storage

AIInsight **never stores your code, prompts, or responses**. This is a fundamental design decision:

### What We Collect

| Data Type | Stored | Purpose |
|-----------|--------|---------|
| Token counts | ✅ | Cost calculation |
| Model names | ✅ | Usage analytics |
| Timestamps | ✅ | Time-series data |
| Session metadata | ✅ | Session grouping |
| Cost estimates | ✅ | Budget tracking |
| Machine hostname | ✅ | Agent identification |
| OS/Architecture | ✅ | Compatibility info |

### What We Never Collect

| Data Type | Stored | Reason |
|-----------|--------|--------|
| Prompts | ❌ | Privacy |
| Code | ❌ | Privacy |
| Responses | ❌ | Privacy |
| File contents | ❌ | Privacy |
| Credentials | ❌ | Security |

## Data Collection

### Session Metadata

When AIInsight parses your AI coding tool logs, it extracts:

- **Session ID** — Unique identifier for the conversation
- **Provider** — Which AI tool was used (Claude, Codex, etc.)
- **Model** — Which model was used (claude-sonnet-4-20250514, etc.)
- **Token counts** — Input, output, cache read, cache write
- **Cost** — Calculated from published pricing
- **Timestamps** — When the session occurred
- **Project name** — Directory name (not full path)

### Example Event

```json
{
  "sessionId": "sess_abc123",
  "provider": "claude",
  "model": "claude-sonnet-4-20250514",
  "inputTokens": 1500,
  "outputTokens": 800,
  "cacheReadTokens": 0,
  "cacheWriteTokens": 0,
  "estimatedCost": 0.05,
  "timestamp": "2026-06-20T12:00:00Z",
  "projectName": "my-app"
}
```

Notice: No prompts, no code, no responses.

## API Key Security

### Hashing

API keys are hashed with **Argon2** before storage. The full key is never stored:

```
Creation: aisk_abc123... → argon2 hash → stored
Lookup:   aisk_abc123... → argon2 hash → compare with stored
```

### Key Format

| Key Type | Prefix | Purpose |
|----------|--------|---------|
| Dashboard API Key | `aisk_XXXXXXXX_...` | User authentication |
| Enrollment Key | `ai_live_XXXXXXXX_...` | Agent registration |

### Best Practices

1. **Use separate keys** for different environments
2. **Rotate keys periodically** for security
3. **Revoke unused keys** to reduce attack surface
4. **Never commit keys** to version control
5. **Use minimum required permissions** (read-only when possible)

## Data Encryption

### In Transit

All API communication uses HTTPS/TLS encryption:

- Dashboard Web → Dashboard API: HTTPS
- Agent → Ingestion API: HTTPS
- Dashboard API → PostgreSQL: TLS (if configured)

### At Rest

PostgreSQL data is encrypted at rest when using:

- AWS RDS with encryption enabled
- GCP Cloud SQL with encryption
- Azure Database with encryption
- Self-hosted with disk encryption (LUKS, FileVault, etc.)

## Multi-Tenancy

Every data query filters by `organization_id`. Users belong to exactly one organization. Teams, machines, sessions, and events are all scoped to an organization. There is no cross-organization data access.

### Data Isolation

```sql
-- All queries include organization_id filter
SELECT * FROM sessions WHERE organization_id = $1;
SELECT * FROM events WHERE organization_id = $1;
SELECT * FROM daily_usage WHERE organization_id = $1;
```

## Authentication

### JWT Tokens

- **Access tokens** expire after 24 hours
- **Refresh tokens** expire after 30 days
- Tokens are signed with HS256 using a secret key

### Password Storage

Passwords are hashed with **Argon2** before storage. The plain text password is never stored.

### Session Management

- Sessions are stored in HTTP-only cookies
- CSRF protection is enabled
- Rate limiting prevents brute force attacks

## Compliance

### GDPR

AIInsight supports GDPR compliance by:

- Not storing personal code or prompts
- Providing data export capabilities
- Supporting data deletion requests
- Minimal data collection

### CCPA

AIInsight supports CCPA compliance by:

- Not selling user data
- Providing data access capabilities
- Supporting data deletion requests

## Self-Hosted Security

When self-hosting AIInsight:

1. **Use strong passwords** for PostgreSQL and JWT secrets
2. **Enable TLS** for all API communication
3. **Restrict network access** to API ports
4. **Regular backups** to prevent data loss
5. **Monitor logs** for suspicious activity

### Production Checklist

- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] Strong `POSTGRES_PASSWORD`
- [ ] TLS enabled for API endpoints
- [ ] Network restricted to trusted IPs
- [ ] Regular backup schedule
- [ ] Log monitoring enabled

## Reporting Security Issues

Do not file security issues in the public tracker. See [SECURITY.md](../../SECURITY.md) for the disclosure process.

## Related Documentation

- [Architecture: Security](../architecture/security.md) — Security architecture
- [Architecture: Authentication](../architecture/authentication-flow.md) — Auth flow
- [Operations: Deployment](../operations/deployment.md) — Secure deployment
