# FAQ

## General

### What is AIInsight?

AIInsight tracks token usage across AI coding tools (Claude, Codex, Cursor, Gemini). It runs locally on your machine, syncs to a self-hosted dashboard, and gives you per-task cost visibility.

### Is my code sent to the cloud?

No. AIInsight only sends token counts, model names, costs, and metadata. Prompts and responses are never transmitted.

### Which AI coding tools are supported?

| Tool | Parser | Cloud Sync |
|------|--------|------------|
| Claude Code | ✅ | ✅ |
| Codex CLI | ✅ | ✅ |
| Cursor | ✅ | ✅ |
| Gemini CLI | ✅ | ✅ |
| Warp | ✅ | ❌ (CLI only) |
| OpenCode | ✅ | ❌ (CLI only) |

### Is this self-hosted?

Yes. You run your own PostgreSQL database and APIs. No data leaves your infrastructure.

---

## Sync

### How does historical sync work?

Historical sync scans all JSONL log files from your AI coding tools, normalizes the data, and uploads it to the Ingestion API. It uses checksums to skip unchanged files.

### How does incremental sync work?

Incremental sync uses a timestamp watermark. Only calls with timestamps newer than the last synced call are uploaded. This is combined with file checksums for efficiency.

### How does deduplication work?

Three layers prevent duplicates:

1. **File checksum**: Unchanged files are skipped entirely
2. **Timestamp watermark**: Already-synced calls are filtered out
3. **Database UPSERT**: Re-uploading the same session is a no-op (`UNIQUE(provider_id, external_session_id)`)

### What happens if sync fails?

Failed batches are queued to disk (`~/.config/aiinsight/upload-queue/`). They're retried with exponential backoff (1s, 2s, 4s) up to 3 times. Remaining batches are retried on next sync.

### How often should I sync?

The default sync interval is 300 seconds (5 minutes). You can configure this with `SYNC_INTERVAL` environment variable or run `aiinsight sync` manually.

---

## Cost

### How is cost calculated?

Cost is calculated by the provider's parser using published pricing:

```
cost = (input_tokens × input_price) + (output_tokens × output_price) + cache_adjustments
```

Some providers include cost directly in their JSONL logs. In that case, the provided cost is used.

### What does "estimated" cost mean?

When a provider doesn't include cost in its logs, AIInsight calculates it from token counts and model pricing. The `costIsEstimated` flag indicates this.

### Are cache tokens counted differently?

Yes. Cache read tokens are cheaper than input tokens. Cache write tokens have a separate cost. The cost calculation accounts for these differences.

---

## Sessions

### How are sessions identified?

A session corresponds to a single JSONL source file (e.g., one Claude conversation). The session ID is the provider's own identifier, combined with the provider name for uniqueness.

### What is an event?

An event represents a single API call (one request-response pair) within a session. Each event has token counts, cost, model, and timestamp.

### Why aren't prompts stored?

AIInsight stores token counts and metadata but not prompts. This is for:

1. **Privacy**: Prompts may contain sensitive code
2. **Storage**: Prompt data would increase storage 10-100x
3. **Compliance**: Simplifies GDPR/CCPA compliance
4. **Cost tracking**: The primary use case is cost analytics

The full provider payload is stored in `events.payload` for debugging, but analytics use only normalized fields.

---

## API Keys

### Can I revoke API keys?

Yes. Go to **Settings** → **API Keys** and click **Revoke** next to the key.

### Can I have multiple API keys?

Yes. You can create multiple keys with different roles (`read`, `write`, `admin`).

### What happens if I lose my API key?

You can't recover it. Create a new one and update your sync configuration.

### How are API keys stored?

API keys are hashed with Argon2 before storage. Only the prefix is stored in plaintext for lookup. The full key is only shown once on creation.

---

## Organization

### Can I have multiple organizations?

Currently, each user belongs to exactly one organization. Multi-organization support is planned for a future release.

### Can I change my role?

Roles are assigned by organization admins. Contact your org admin to change your role.

### What happens when I delete my organization?

All data is permanently deleted: users, machines, sessions, events, API keys, and all analytics.

---

## Deployment

### What are the minimum requirements?

- Node.js 22+
- PostgreSQL 16+
- 1GB RAM (for APIs)
- 10GB storage (depends on usage)

### Can I use SQLite instead of PostgreSQL?

No. The schema uses PostgreSQL-specific features (UUID, JSONB, UPSERT).

### How do I backup my data?

```bash
pg_dump $DATABASE_URL > backup.sql
```

### How do I restore from backup?

```bash
psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Sync shows "No calls found in source"

Your JSONL files may be empty or in an unexpected format. Check that your AI coding tool is logging to the expected location.

### Dashboard shows zero cost

Run a backfill: `POST /api/v1/dashboard/backfill` (admin only). This aggregates raw events into daily tables.

### "Rate limit exceeded" errors

The Ingestion API allows 1000 requests/minute. If you hit this limit, wait a minute or increase the batch size in your sync configuration.

### Agent shows "OFFLINE"

The agent hasn't sent a heartbeat in 5 minutes. Check that the agent is running and can reach the Dashboard API.
