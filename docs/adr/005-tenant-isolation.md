# ADR-005: Tenant Isolation Strategy

**Status**: Accepted

**Context**: AIInsight supports multiple organizations. Each organization's data must be isolated.

**Decision**: Use row-level security via `organization_id` foreign keys on all tables. Every query includes `WHERE organization_id = $1`. No cross-organization queries exist.

**Consequences**:
- ✅ Simple implementation (no RLS policies needed)
- ✅ Clear data boundaries
- ✅ Easy to audit (all queries include org filter)
- ❌ Relies on developer discipline (no DB-level enforcement)
- ❌ Cannot share data across organizations

**Alternatives Considered**:
1. PostgreSQL Row-Level Security: Rejected due to complexity
2. Separate schemas per tenant: Rejected due to operational overhead
3. Separate databases: Rejected due to cost and complexity
