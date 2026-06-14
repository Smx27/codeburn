# ADR-005: Idempotent Aggregation Jobs

## Status

Accepted

## Context

The analytics aggregation jobs need to handle failures gracefully and be safe to rerun.

## Decision

We will use idempotent aggregation jobs with `ON CONFLICT ... DO UPDATE` upserts.

## Consequences

### Positive
- Safe to rerun (idempotent)
- Handles failures gracefully
- No data loss on partial failures
- Resume capability for backfill

### Negative
- Slower than append-only
- Requires unique constraints
- More complex SQL

### Risks
- Unique constraints may slow down inserts (mitigated by proper indexing)

## Alternatives Considered

1. **Append-only (no updates)**
   - Pros: Fast inserts, simple
   - Cons: Duplicate data, no updates

2. **Delete + insert**
   - Pros: Simple, no duplicates
   - Cons: Data loss on failure, not atomic

3. **Upsert with ON CONFLICT (chosen)**
   - Pros: Idempotent, safe, atomic
   - Cons: Slower, requires unique constraints

## References

- `packages/analytics-engine/src/repositories/analytics.repository.ts`
- `packages/analytics-engine/src/jobs/*.ts`