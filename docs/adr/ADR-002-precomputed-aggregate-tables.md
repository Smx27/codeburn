# ADR-002: Precomputed Aggregate Tables

## Status

Accepted

## Context

The dashboard needs to display analytics data quickly (sub-500ms). Querying raw events with millions of rows would be slow and impact user experience.

## Decision

We will use precomputed aggregate tables instead of querying raw events directly.

## Consequences

### Positive
- Sub-500ms dashboard response times
- Idempotent upserts enable safe reruns
- Separate tables per dimension enable targeted queries
- No impact on ingestion performance

### Negative
- Data latency (hourly aggregation delay)
- Storage overhead (duplicate data in summary tables)
- Complexity (aggregation jobs to maintain)

### Risks
- Aggregation delay may confuse users expecting real-time data (mitigated by clear UI indicators)

## Alternatives Considered

1. **Query raw events directly**
   - Pros: Real-time data, no storage overhead
   - Cons: Slow at scale, impacts ingestion performance

2. **Materialized views**
   - Pros: PostgreSQL-native, automatic refresh
   - Cons: Limited customization, refresh locking

3. **Precomputed aggregate tables (chosen)**
   - Pros: Fast queries, flexible, idempotent
   - Cons: Storage overhead, aggregation delay

## References

- `packages/analytics-engine/src/aggregators/*.ts`
- `packages/analytics-engine/src/repositories/analytics.repository.ts`