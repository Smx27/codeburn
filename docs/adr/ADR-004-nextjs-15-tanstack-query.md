# ADR-004: Next.js 15 + TanStack Query

## Status

Accepted

## Context

The Dashboard Web needs a modern frontend framework for data visualization and user interaction.

## Decision

We will use Next.js 15 with TanStack Query for data fetching and caching.

## Consequences

### Positive
- Next.js 15 App Router for modern React patterns
- TanStack Query for automatic caching and background refetch
- Server-side rendering capability (future)
- Built-in API routes (future)
- Rich ecosystem of libraries

### Negative
- Heavier bundle than Vite
- Learning curve for App Router
- Server component complexity

### Risks
- Bundle size may impact performance (mitigated by code splitting)

## Alternatives Considered

1. **React + Vite**
   - Pros: Lightweight, fast development
   - Cons: No SSR, no built-in routing

2. **Next.js 14 (Pages Router)**
   - Pros: Stable, well-documented
   - Cons: Older patterns, less flexible

3. **Remix**
   - Pros: Full-stack, data loading
   - Cons: Smaller ecosystem, less flexible

4. **Next.js 15 + TanStack Query (chosen)**
   - Pros: Modern patterns, flexible, rich ecosystem
   - Cons: Heavier bundle, learning curve

## References

- `apps/dashboard-web/`
- `docs/phases/phase-02-analytics-dashboard.md`