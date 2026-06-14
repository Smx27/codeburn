# ADR-001: Separate Analytics Bounded Context

## Status

Accepted

## Context

AiInsight Cloud needs to provide analytics and dashboard capabilities for team collaboration. The question is whether to add analytics to the existing Ingestion API or create a separate bounded context.

## Decision

We will create a separate `@aiinsight/analytics-engine` package as a bounded context for analytics.

## Consequences

### Positive
- Clear separation of concerns between ingestion and analytics
- Independent scaling (analytics jobs vs API)
- Reusable across Dashboard API and future services
- No coupling to Ingestion API changes
- Easier to test and maintain

### Negative
- Additional package to maintain
- Cross-package dependencies
- Build complexity

### Risks
- Type duplication between packages (mitigated by extracting shared types in Phase 03)

## Alternatives Considered

1. **Add analytics to Ingestion API**
   - Pros: Single deployment, shared database connection
   - Cons: Coupling, harder to scale, mixing concerns

2. **Shared library**
   - Pros: Reusable, no duplication
   - Cons: Still couples ingestion and analytics

3. **Separate package (chosen)**
   - Pros: Clean separation, independent scaling
   - Cons: Additional complexity

## References

- `packages/analytics-engine/`
- `docs/phases/phase-02-analytics-dashboard.md`