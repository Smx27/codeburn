# Generate API Key

API keys allow your agent to authenticate with AIInsight Cloud and sync data.

## Creating an API Key

### Via Dashboard

1. Navigate to **Settings → API Keys**
2. Click **Generate API Key**
3. Enter a descriptive name (e.g., `laptop-work`, `ci-pipeline`)
4. Select a role:
   - **Read** — View analytics only
   - **Write** — View analytics + sync data
   - **Admin** — Full access
5. Click **Generate**
6. Copy the key immediately (shown only once)

<!-- Screenshot: API key generation form -->

> **Security:** The full API key is only shown once at creation. Store it securely.

### Via API

```bash
curl -X POST http://localhost:3002/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Agent Key",
    "role": "write"
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Agent Key",
  "prefix": "aisk_abc12345",
  "role": "write",
  "created_at": "2026-06-20T12:00:00Z",
  "key": "aisk_abc12345_678901234567890123456789012345678901234567890123"
}
```

> **Note:** The `key` field is only shown once. Store it securely.

## API Key Format

| Key Type | Prefix | Purpose |
|----------|--------|---------|
| Dashboard API Key | `aisk_XXXXXXXX_...` | User authentication for sync engine |
| Enrollment Key | `ai_live_XXXXXXXX_...` | Agent registration |

## Using API Keys

### With the CLI

```bash
aiinsight login
# Paste your API key when prompted
```

### With curl

```bash
# Using Authorization header
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "Authorization: Bearer aisk_your_key_here"

# Or using X-API-Key header
curl http://localhost:3002/api/v1/dashboard/overview \
  -H "X-API-Key aisk_your_key_here"
```

## Managing API Keys

### Viewing Keys

**Via Dashboard:**
Navigate to **Settings → API Keys** to see all keys.

**Via API:**
```bash
curl http://localhost:3002/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN"
```

### Revoking Keys

**Via Dashboard:**
1. Go to **Settings → API Keys**
2. Find the key
3. Click **Revoke**

**Via API:**
```bash
curl -X DELETE http://localhost:3002/api/v1/api-keys/{keyId} \
  -H "Authorization: Bearer $TOKEN"
```

## Security Best Practices

1. **Use separate keys** for different environments (dev, staging, production)
2. **Rotate keys periodically** for security
3. **Revoke unused keys** to reduce attack surface
4. **Never commit keys** to version control
5. **Use minimum required permissions** (read-only when possible)

## Troubleshooting

### API key not working

1. Verify the key is correct and not revoked
2. Check the key prefix matches the expected format
3. Ensure you're using the correct authentication header
4. Generate a new key if the current one is compromised

### "Invalid API key" error

- Check that the key hasn't been revoked in **Settings → API Keys**
- Verify you're using the correct key (not an enrollment key)
- Ensure the key is properly formatted in the Authorization header

## Related Documentation

- [Install Agent](install-agent.md) — Install the CLI agent
- [Getting Started](getting-started.md) — Full onboarding walkthrough
- [Organization Onboarding](../architecture/organization-flow.md) — Org configuration
