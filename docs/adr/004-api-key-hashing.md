# ADR-004: API Key Hashing

**Status**: Accepted

**Context**: API keys authenticate machine-to-machine communication. Keys must be stored securely.

**Decision**: Hash API keys with Argon2 before storage. Store only the prefix in plaintext for lookup. Show the full key only on creation (one-time secret).

**Consequences**:
- ✅ Keys cannot be recovered from database breaches
- ✅ Prefix-based lookup is fast (indexed)
- ✅ Argon2 is memory-hard (resistant to GPU attacks)
- ❌ Keys cannot be retrieved after creation
- ❌ Slightly more complex implementation

**Alternatives Considered**:
1. Store keys in plaintext: Rejected due to security risk
2. Store keys with SHA-256: Rejected due to faster GPU cracking
3. Store keys with bcrypt: Rejected due to Argon2 being more modern
