# ADR-003: No Prompt Storage in Beta

**Status**: Accepted

**Context**: AIInsight tracks AI coding tool usage. Prompts and responses contain sensitive code, credentials, and personal information.

**Decision**: Store only token counts, model names, costs, and metadata. Do not store prompt text or response text. Preserve the full provider payload in `events.payload` JSONB for debugging, but do not query it for analytics.

**Consequences**:
- ✅ Privacy: No sensitive code stored
- ✅ Storage: 10-100x smaller than storing prompts
- ✅ Compliance: Simplifies GDPR/CCPA compliance
- ✅ Cost tracking: Primary use case is cost analytics, not content analysis
- ❌ Cannot analyze prompt patterns or content
- ❌ Cannot replay or audit specific conversations

**Alternatives Considered**:
1. Store prompts with encryption: Rejected due to key management complexity
2. Store prompts with redaction: Rejected due to accuracy concerns
3. Store prompts in separate encrypted store: Rejected for beta simplicity
