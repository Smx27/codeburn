# ADR-003: JWT + API Key Dual Authentication

## Status

Accepted

## Context

The Dashboard API needs to support two use cases:
1. Web dashboard users (interactive login)
2. Machine-to-machine (sync engine, CLI)

## Decision

We will implement a dual authentication scheme supporting both JWT tokens and API keys.

## Consequences

### Positive
- JWT for web dashboard (stateless, scalable)
- API keys for machine-to-machine (simple, no user interaction)
- Dual scheme supports both use cases without complexity
- Clear separation of concerns

### Negative
- Two auth paths to maintain
- API key security (bcrypt hashing required)
- JWT expiry management

### Risks
- Auth complexity may lead to security vulnerabilities (mitigated by clear documentation and testing)

## Alternatives Considered

1. **JWT only**
   - Pros: Single auth path, stateless
   - Cons: Requires user interaction for machine-to-machine

2. **API keys only**
   - Pros: Simple, no expiry management
   - Cons: Requires user interaction for web dashboard

3. **OAuth 2.0**
   - Pros: Industry standard, flexible
   - Cons: Complex implementation, requires external provider

4. **JWT + API key dual scheme (chosen)**
   - Pros: Supports both use cases, clear separation
   - Cons: Two auth paths to maintain

## References

- `apps/dashboard-api/src/middlewares/auth.middleware.ts`
- `docs/phases/phase-02-analytics-dashboard.md`