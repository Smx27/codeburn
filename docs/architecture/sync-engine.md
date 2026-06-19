# Sync Engine

The sync engine runs on developer machines and uploads AI coding tool usage data to the cloud.

---

## Overview

```mermaid
graph LR
    A[JSONL Files] --> B[Provider Parser]
    B --> C[ParsedProviderCall]
    C --> D[Deduplication]
    D --> E[Provider Adapter]
    E --> F[SyncSession + SyncEvent]
    F --> G[BatchUploader]
    G -->|POST /api/v1/ingest/batch| H[Ingestion API]
```

---

## Sync Modes

### Historical Sync

Full scan of all available data. Used on first run or when data recovery is needed.

```mermaid
sequenceDiagram
    participant SE as Sync Engine
    participant IA as Ingestion API

    SE->>SE: Filter providers (claude, codex, cursor, gemini)
    loop For each provider
        SE->>SE: Discover JSONL source files
        loop For each source
            SE->>SE: Load sync state (checksum + watermark)
            SE->>SE: Calculate file checksum
            alt Checksum matches
                SE->>SE: Skip source (unchanged)
            else Checksum differs or new
                SE->>SE: Parse JSONL → ParsedProviderCall[]
                SE->>SE: Deduplicate by sessionId (Map)
                SE->>IA: POST /api/v1/ingest/batch
                SE->>SE: Save sync state (checksum + last timestamp)
            end
        end
    end
```

### Incremental Sync

Watermark-based. Only uploads calls with timestamps newer than the last synced call.

```mermaid
sequenceDiagram
    participant SE as Sync Engine
    participant IA as Ingestion API

    SE->>SE: Filter providers
    loop For each provider
        SE->>SE: Discover JSONL source files
        loop For each source
            SE->>SE: Load sync state (checksum + lastCallTimestamp)
            SE->>SE: Calculate file checksum
            alt Checksum matches
                SE->>SE: Skip source (unchanged)
            else Checksum differs
                SE->>SE: Parse JSONL → ParsedProviderCall[]
                SE->>SE: Filter calls where timestamp > lastCallTimestamp
                alt No new calls
                    SE->>SE: Skip source
                else New calls exist
                    SE->>SE: Deduplicate by sessionId
                    SE->>IA: POST /api/v1/ingest/batch
                    SE->>SE: Save sync state (checksum + last timestamp)
                end
            end
        end
    end
```

---

## Provider Adapters

Each provider has a parser (reads JSONL) and an adapter (normalizes to SyncSession/SyncEvent).

| Provider | Parser | Adapter | Cloud Sync |
|----------|--------|---------|------------|
| Claude | ✅ | ✅ `claudeAdapter` | ✅ |
| Codex | ✅ | ✅ `codexAdapter` | ✅ |
| Cursor | ✅ | ✅ `cursorAdapter` | ✅ |
| Gemini | ✅ | ✅ `geminiAdapter` | ✅ |
| Warp | ✅ | ❌ | ❌ |
| OpenCode | ✅ | ❌ | ❌ |

Warp and OpenCode have parsers for local CLI usage but no adapters for cloud sync.

See [provider-model.md](provider-model.md) for details on normalization.

---

## Batch Uploader

The `BatchUploader` handles reliable upload with durability and retry.

### Flow

```mermaid
sequenceDiagram
    participant SE as Sync Engine
    participant Q as Upload Queue (Disk)
    participant IA as Ingestion API

    SE->>Q: Persist batch to ~/.config/aiinsight/upload-queue/
    SE->>IA: POST /api/v1/ingest/batch
    alt Success
        IA-->>SE: 200 OK
        SE->>Q: Delete batch file
    else Failure
        IA-->>SE: 5xx / Network error
        SE->>SE: Exponential backoff (1s, 2s, 4s)
        SE->>IA: Retry POST
        alt Max retries (3) exceeded
            SE->>Q: Keep batch in queue for later
        end
    end
```

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `batchSize` | 1000 | Events per batch |
| `maxRetries` | 3 | Maximum retry attempts |
| `baseDelayMs` | 1000 | Base delay for exponential backoff |

### Durability

- Batches are persisted to disk before upload
- On startup, the uploader loads queued batches from `~/.config/aiinsight/upload-queue/`
- Failed batches remain on disk for retry
- Successfully uploaded batches are deleted from disk

---

## Local Sync State

Stored as JSON files in `~/.config/aiinsight/sync-state/`.

### State Record

| Field | Purpose |
|-------|---------|
| `organizationId` | Tenant ID |
| `machineId` | Machine ID |
| `provider` | Provider name |
| `sourceIdentifier` | Source file path |
| `lastHash` | SHA-256 checksum of file contents |
| `lastCallTimestamp` | Timestamp of last synced call (watermark) |
| `lastProcessedAt` | When this source was last processed |

### Checksum Deduplication

Before parsing a source file, the sync engine calculates its SHA-256 checksum. If the checksum matches the stored state, the source is skipped. This prevents re-processing unchanged files.

### Watermark Deduplication

For incremental sync, the `lastCallTimestamp` watermark ensures only calls newer than the last synced call are uploaded. This is independent of the file checksum — a file can grow (new calls appended) without changing the checksum of existing content.

---

## Failure Recovery

| Failure | Recovery |
|---------|----------|
| Network error during upload | Exponential backoff retry, batch stays in queue |
| API returns 5xx | Exponential backoff retry |
| API returns 4xx (validation) | Batch is dropped, logged as error |
| Process killed mid-sync | Queue files on disk, loaded on next startup |
| Source file deleted | Sync state remains, source is skipped on next discovery |
| Provider parse error | Source is skipped, logged as error, other sources continue |

---

## Deduplication Strategy

Three layers prevent duplicates:

1. **File checksum**: Skips unchanged files entirely
2. **Timestamp watermark**: Filters out already-synced calls within changed files
3. **Database UPSERT**: `sessions` table has `UNIQUE(provider_id, external_session_id)` — re-uploading the same session is a no-op

Events have no database-level dedup constraint. The sync engine's watermark prevents duplicate event uploads in normal operation.
