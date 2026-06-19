# ADR-006: Local Sync State Design

**Status**: Accepted

**Context**: The sync engine needs to track which files have been synced and what the last timestamp was. This state must persist across runs.

**Decision**: Store sync state as JSON files in `~/.config/aiinsight/sync-state/`. Each file represents one source's state with checksum, watermark, and timestamps.

**Consequences**:
- ✅ Simple implementation (no database required)
- ✅ Fast read/write (local filesystem)
- ✅ No network dependency for state checks
- ❌ State is per-machine (not shared)
- ❌ No atomicity guarantees (file corruption possible)
- ❌ State files may accumulate

**Alternatives Considered**:
1. Database-backed state: Rejected due to network dependency
2. Git-based state: Rejected due to complexity
3. In-memory state: Rejected due to no persistence
