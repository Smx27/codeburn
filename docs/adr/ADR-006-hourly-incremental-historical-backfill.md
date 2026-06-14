# ADR-006: Hourly Incremental + Historical Backfill Job Pattern

## Status

Accepted

## Context

The analytics aggregation needs to handle both daily incremental updates and historical backfill for existing data.

## Decision

We will implement two job patterns:
1. **Daily Aggregation Job:** Runs hourly, processes yesterday's data for all organizations
2. **Historical Backfill Job:** Runs on demand, processes all unaggregated dates for a single organization

## Consequences

### Positive
- Daily job ensures data freshness (hourly updates)
- Backfill job handles historical data without blocking daily operations
- Resume capability for backfill (tracks progress in `aggregation_runs` table)
- Idempotent upserts enable safe reruns

### Negative
- Two job patterns to maintain
- Backfill may be slow for large date ranges
- Progress tracking adds complexity

### Risks
- Backfill may impact database performance (mitigated by date-by-date processing)

## Alternatives Considered

1. **Single job for both**
   - Pros: Simple, one job to maintain
   - Cons: Complex logic, may block daily updates

2. **Hourly incremental only**
   - Pros: Simple, fresh data
   - Cons: No backfill capability

3. **Historical backfill only**
   - Pros: Simple, handles all data
   - Cons: No daily freshness

4. **Two job patterns (chosen)**
   - Pros: Clear separation, fresh data + backfill capability
   - Cons: Two jobs to maintain

## References

- `packages/analytics-engine/src/jobs/dailyAggregation.job.ts`
- `packages/analytics-engine/src/jobs/historicalBackfill.job.ts`