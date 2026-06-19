# ADR-001: Normalized Events Instead of Provider Tables

**Status**: Accepted

**Context**: AIInsight tracks usage from multiple AI coding tools (Claude, Codex, Cursor, Gemini). Each tool stores data differently.

**Decision**: Use a single normalized `events` table with provider-specific fields in a JSONB `payload` column, rather than creating separate tables for each provider.

**Consequences**:
- ✅ Cross-provider analytics require a single query
- ✅ Adding a new provider requires only a parser + adapter, no schema changes
- ✅ Core analytics fields (tokens, cost, model) are common across providers
- ❌ Provider-specific queries require JSONB extraction
- ❌ Provider-specific fields are not first-class columns

**Alternatives Considered**:
1. Provider-specific tables: Rejected due to schema proliferation and cross-query complexity
2. Separate analytics tables: Rejected due to storage overhead and query complexity
