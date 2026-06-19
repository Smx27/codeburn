# ADR-002: Batch Uploads Instead of Per-Event Uploads

**Status**: Accepted

**Context**: The sync engine needs to upload usage data from developer machines to the cloud. Per-event uploads would create excessive HTTP overhead.

**Decision**: Use batch uploads with configurable batch size (default 1000 events). Batches are persisted to disk before upload for durability.

**Consequences**:
- ✅ Reduced HTTP overhead (1000 events in 1 request)
- ✅ Durability via disk persistence
- ✅ Retry logic with exponential backoff
- ❌ Slightly more complex implementation
- ❌ Failed batches may contain mixed data (some sessions may already be in DB)

**Alternatives Considered**:
1. Per-event uploads: Rejected due to HTTP overhead and rate limiting concerns
2. WebSocket streaming: Rejected due to complexity and reliability concerns
